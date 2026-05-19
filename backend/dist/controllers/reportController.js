"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportController = void 0;
const db_1 = require("../config/db");
const mediaStorage_1 = require("../utils/mediaStorage");
const emailService_1 = require("../utils/emailService");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const zod_1 = require("zod");
const reportSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    reporter_id: zod_1.z.string().uuid().optional().nullable(),
    issue_type: zod_1.z.string().min(1).max(100),
    other_type_specification: zod_1.z.string().max(255).optional().nullable(),
    title: zod_1.z.string().min(1).max(255),
    description: zod_1.z.string().min(1).max(2000),
    municipality_id: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]),
    barangay_id: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]),
    location: zod_1.z.string().min(1).max(500),
    landmark: zod_1.z.string().max(255).optional().nullable(),
    urgency: zod_1.z.enum(['Low', 'Medium', 'High', 'Critical']).optional().default('Medium'),
    is_anonymous: zod_1.z.boolean().optional().default(false),
    reporter_name: zod_1.z.string().max(255).optional().nullable(),
    reporter_email: zod_1.z.string().email().optional().nullable().or(zod_1.z.literal('')),
    reporter_phone: zod_1.z.string().max(50).optional().nullable(),
    photos: zod_1.z.array(zod_1.z.string().refine(val => {
        if (val.startsWith('data:image/')) {
            const sizeInBytes = val.length * 0.75;
            return sizeInBytes <= 5 * 1024 * 1024;
        }
        return val.startsWith('http');
    }, { message: 'Photo must be a valid URL or base64 image under 5MB' })).max(10).optional().nullable(),
});
const JWT_SECRET = process.env.JWT_SECRET;
async function getAdminMunicipality(adminId) {
    const { data, error } = await db_1.supabase
        .from('admins')
        .select('municipality_id')
        .eq('id', adminId)
        .maybeSingle();
    if (error)
        throw error;
    return data?.municipality_id || null;
}
exports.reportController = {
    // CREATE REPORT
    async createReport(req, res) {
        try {
            const { id, // Frontend can send UUID or we can generate logic (e.g. 'RPT-...')
            reporter_id, issue_type, other_type_specification, title, description, municipality_id, barangay_id, location, landmark, urgency, is_anonymous, reporter_name, reporter_email, reporter_phone, photos // Expected as array of public URLs String[]
             } = req.body;
            const validation = reportSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({ error: 'Validation failed', details: validation.error.format() });
            }
            // Best-effort identity fallback: if Authorization exists, trust token identity for client linkage.
            const authHeader = req.headers.authorization;
            let tokenUserId = null;
            if (authHeader?.startsWith('Bearer ')) {
                try {
                    const token = authHeader.split(' ')[1];
                    const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
                    if (decoded?.id && decoded?.role === 'client') {
                        tokenUserId = decoded.id;
                    }
                }
                catch {
                    tokenUserId = null;
                }
            }
            const effectiveReporterId = reporter_id || tokenUserId;
            let effectiveReporterName = reporter_name;
            let effectiveReporterEmail = reporter_email;
            let effectiveReporterPhone = reporter_phone;
            if (effectiveReporterId && (!effectiveReporterName || !effectiveReporterEmail || !effectiveReporterPhone)) {
                const { data: reporterProfile } = await db_1.supabase
                    .from('clients')
                    .select('full_name, email, contact_number')
                    .eq('id', effectiveReporterId)
                    .maybeSingle();
                if (reporterProfile) {
                    effectiveReporterName = effectiveReporterName || reporterProfile.full_name || null;
                    effectiveReporterEmail = effectiveReporterEmail || reporterProfile.email || null;
                    effectiveReporterPhone = effectiveReporterPhone || reporterProfile.contact_number || null;
                }
            }
            // Handle custom ID generation if not provided
            const reportId = id || `RPT-${crypto_1.default.randomUUID().slice(0, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;
            // 1. Insert into reports
            const { data: report, error } = await db_1.supabase
                .from('reports')
                .insert([{
                    id: reportId,
                    reporter_id: effectiveReporterId,
                    issue_type,
                    other_type_specification,
                    title,
                    description,
                    municipality_id,
                    barangay_id,
                    location,
                    landmark,
                    urgency,
                    is_anonymous,
                    reporter_name: is_anonymous ? null : effectiveReporterName,
                    reporter_email: is_anonymous ? null : effectiveReporterEmail,
                    reporter_phone: is_anonymous ? null : effectiveReporterPhone,
                    status: 'In Review'
                }])
                .select()
                .single();
            if (error)
                throw error;
            // 2. Insert into report_photos if photo URLs exist
            if (photos && Array.isArray(photos) && photos.length > 0) {
                const storedPhotoUrls = await (0, mediaStorage_1.persistImageInputs)(photos, `reports/${reportId}/initial`);
                const photoInserts = storedPhotoUrls.map((url) => ({
                    report_id: reportId,
                    photo_url: url,
                    is_completion_photo: false
                }));
                const { error: photoErr } = await db_1.supabase
                    .from('report_photos')
                    .insert(photoInserts);
                if (photoErr)
                    console.error("Error inserting photos:", photoErr);
            }
            // 3. Add to timeline
            await db_1.supabase.from('report_timeline').insert([{
                    report_id: reportId,
                    status: 'In Review',
                    notes: 'Report created and submitted.'
                }]);
            // 4. Send tracking email to reporters who provided an email
            let emailSent = false;
            const emailUsed = effectiveReporterEmail || null;
            if (emailUsed) {
                try {
                    await (0, emailService_1.sendReportTrackingEmail)(emailUsed, effectiveReporterName || 'Anonymous User', reportId, title);
                    emailSent = true;
                }
                catch (emailErr) {
                    // Non-fatal: log but don't roll back report creation
                    console.error('[createReport] Failed to send tracking email:', emailErr);
                }
            }
            return res.status(201).json({
                message: 'Report created successfully',
                data: report,
                email_sent: emailSent,
                email_used: emailUsed,
            });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    },
    // READ REPORTS
    async getReports(req, res) {
        try {
            const { municipality_id, status, reporter_id, reporter_email, updated_after } = req.query;
            const reporterIdParam = reporter_id ? String(reporter_id).trim() : '';
            const baseSelect = `
        *,
        municipalities(name),
        barangays(name),
        report_photos(photo_url, is_completion_photo)
      `;
            const applyBaseFilters = (query, options) => {
                let q = query;
                // Cache Incremental Sync Hook (Stale-While-Revalidate Delta API)
                if (updated_after) {
                    const timestamp = new Date(String(updated_after)).toISOString();
                    q = q.gte('updated_at', timestamp);
                }
                if (municipality_id) {
                    const rawMunicipality = String(municipality_id);
                    const normalizedDash = rawMunicipality.replace(/_/g, '-');
                    const normalizedUnderscore = rawMunicipality.replace(/-/g, '_');
                    const municipalityCandidates = Array.from(new Set([rawMunicipality, normalizedDash, normalizedUnderscore]));
                    q = q.in('municipality_id', municipalityCandidates);
                }
                // Reporter-scoped history should always return submitted reports across statuses.
                if (status && !options?.ignoreStatus) {
                    q = q.eq('status', status);
                }
                return q;
            };
            const runQuery = async (extraFilter, options) => {
                let q = db_1.supabase
                    .from('reports')
                    .select(baseSelect)
                    .order('created_at', { ascending: false });
                q = applyBaseFilters(q, options);
                if (extraFilter) {
                    q = extraFilter(q);
                }
                const { data, error } = await q;
                if (error)
                    throw error;
                return data || [];
            };
            const emailValue = reporter_email ? String(reporter_email).trim() : '';
            let tokenClientId = '';
            if (!reporterIdParam) {
                const authHeader = req.headers.authorization;
                if (authHeader?.startsWith('Bearer ')) {
                    try {
                        const token = authHeader.split(' ')[1];
                        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
                        if (decoded?.role === 'client' && decoded?.id) {
                            tokenClientId = String(decoded.id);
                        }
                    }
                    catch {
                        tokenClientId = '';
                    }
                }
            }
            const effectiveReporterId = reporterIdParam || tokenClientId;
            const isReporterScoped = Boolean(effectiveReporterId || emailValue);
            let data = [];
            if (effectiveReporterId && emailValue) {
                const [byId, byEmail] = await Promise.all([
                    runQuery((q) => q.eq('reporter_id', effectiveReporterId), { ignoreStatus: isReporterScoped }),
                    runQuery((q) => q.ilike('reporter_email', emailValue), { ignoreStatus: isReporterScoped }),
                ]);
                const merged = new Map();
                [...byId, ...byEmail].forEach((report) => {
                    if (report?.id) {
                        merged.set(report.id, report);
                    }
                });
                data = Array.from(merged.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            }
            else if (effectiveReporterId) {
                data = await runQuery((q) => q.eq('reporter_id', effectiveReporterId), { ignoreStatus: isReporterScoped });
            }
            else if (emailValue) {
                data = await runQuery((q) => q.ilike('reporter_email', emailValue), { ignoreStatus: isReporterScoped });
            }
            else {
                data = await runQuery();
            }
            const completerIds = Array.from(new Set((data || [])
                .map((report) => report?.completed_by)
                .filter((value) => typeof value === 'string' && value.trim().length > 0)));
            if (completerIds.length > 0) {
                const [officersRes, workforceAdminsRes, adminsRes] = await Promise.all([
                    db_1.supabase
                        .from('workforce_officers')
                        .select('id, full_name, department_id')
                        .in('id', completerIds),
                    db_1.supabase
                        .from('workforce_admins')
                        .select('id, full_name, department_id')
                        .in('id', completerIds),
                    db_1.supabase
                        .from('admins')
                        .select('id, full_name, department_id')
                        .in('id', completerIds),
                ]);
                const officers = officersRes.data || [];
                const workforceAdmins = workforceAdminsRes.data || [];
                const admins = adminsRes.data || [];
                const allCompleters = [...officers, ...workforceAdmins, ...admins];
                const departmentIds = Array.from(new Set(allCompleters
                    .map((person) => person?.department_id)
                    .filter((value) => Number.isInteger(Number(value)) && Number(value) > 0)
                    .map((value) => Number(value))));
                const departmentNameById = new Map();
                if (departmentIds.length > 0) {
                    const { data: departments } = await db_1.supabase
                        .from('departments')
                        .select('id, name')
                        .in('id', departmentIds);
                    (departments || []).forEach((department) => {
                        if (department?.id && department?.name) {
                            departmentNameById.set(Number(department.id), department.name);
                        }
                    });
                }
                const completerById = new Map();
                allCompleters.forEach((person) => {
                    if (!person?.id)
                        return;
                    completerById.set(String(person.id), {
                        name: person.full_name || 'Unknown',
                        departmentName: person.department_id
                            ? (departmentNameById.get(Number(person.department_id)) || null)
                            : null,
                    });
                });
                data = data.map((report) => {
                    const completedById = report?.completed_by ? String(report.completed_by) : '';
                    const resolvedCompleter = completedById ? completerById.get(completedById) : null;
                    const completedByName = resolvedCompleter?.name || null;
                    const completedByDepartment = resolvedCompleter?.departmentName || null;
                    return {
                        ...report,
                        completed_by_name: completedByName,
                        completed_by_department_name: completedByDepartment,
                        completed_by_display: completedByName
                            ? `${completedByName}${completedByDepartment ? ` (${completedByDepartment})` : ''}`
                            : (report.completed_by || null),
                    };
                });
            }
            return res.status(200).json({ data });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    },
    // GET SINGLE REPORT BY ID
    async getReportById(req, res) {
        try {
            const { id } = req.params;
            const { data, error } = await db_1.supabase
                .from('reports')
                .select(`
          *,
          municipalities(name),
          barangays(name),
          delegated_department:departments(id, name),
          report_photos(photo_url, is_completion_photo),
          report_timeline(*)
        `)
                .eq('id', id)
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    return res.status(404).json({ error: 'Report not found' });
                }
                throw error;
            }
            return res.status(200).json({ data });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    },
    // UPDATE REPORT STATUS
    async updateReportStatus(req, res) {
        try {
            const { id } = req.params;
            const { status, notes, admin_id, rejection_reason, delegated_to, assigned_to, assigned_role } = req.body;
            const hasDelegationInput = !(delegated_to === undefined || delegated_to === null || String(delegated_to).trim() === '');
            const normalizedDepartmentId = hasDelegationInput
                ? Number(delegated_to)
                : null;
            if (hasDelegationInput && (normalizedDepartmentId === null || Number.isNaN(normalizedDepartmentId) || !Number.isInteger(normalizedDepartmentId) || normalizedDepartmentId <= 0)) {
                return res.status(400).json({ error: 'delegated_to must be a valid department id' });
            }
            if (assigned_to && !assigned_role) {
                return res.status(400).json({ error: 'assigned_role is required when assigned_to is provided' });
            }
            if (assigned_role && !['workforce', 'workforce-admin'].includes(String(assigned_role))) {
                return res.status(400).json({ error: 'assigned_role must be workforce or workforce-admin' });
            }
            const { data: existingReport, error: reportLookupError } = await db_1.supabase
                .from('reports')
                .select('id, title, location, urgency, municipality_id')
                .eq('id', id)
                .single();
            if (reportLookupError || !existingReport) {
                return res.status(404).json({ error: 'Report not found' });
            }
            let delegatedDepartmentName = null;
            if (normalizedDepartmentId !== null) {
                const { data: department, error: departmentError } = await db_1.supabase
                    .from('departments')
                    .select('id, municipality_id, name')
                    .eq('id', normalizedDepartmentId)
                    .maybeSingle();
                if (departmentError)
                    throw departmentError;
                if (!department) {
                    return res.status(400).json({ error: 'Invalid department selected for delegation' });
                }
                if (existingReport.municipality_id && department.municipality_id !== existingReport.municipality_id) {
                    return res.status(400).json({ error: 'Department municipality does not match report municipality' });
                }
                if (req.user?.role === 'admin') {
                    const adminMunicipality = await getAdminMunicipality(req.user.id);
                    if (!adminMunicipality || adminMunicipality !== department.municipality_id) {
                        return res.status(403).json({ error: 'Department is outside your municipality scope' });
                    }
                }
                delegatedDepartmentName = department.name || null;
            }
            if (assigned_to) {
                if (normalizedDepartmentId === null) {
                    return res.status(400).json({ error: 'assigned_to requires delegated_to department' });
                }
                const assigneeRole = String(assigned_role);
                const assigneeTable = assigneeRole === 'workforce' ? 'workforce_officers' : 'workforce_admins';
                const { data: assignee, error: assigneeError } = await db_1.supabase
                    .from(assigneeTable)
                    .select('id, department_id, status')
                    .eq('id', assigned_to)
                    .maybeSingle();
                if (assigneeError)
                    throw assigneeError;
                if (!assignee) {
                    return res.status(400).json({ error: 'Selected assignee does not exist' });
                }
                if (Number(assignee.department_id) !== normalizedDepartmentId) {
                    return res.status(400).json({ error: 'Selected assignee does not belong to the selected department' });
                }
                if (assignee.status && String(assignee.status).toLowerCase() !== 'active') {
                    return res.status(400).json({ error: 'Selected assignee is not active' });
                }
            }
            const updateData = { updated_at: new Date() };
            if (status !== undefined)
                updateData.status = status;
            if (rejection_reason !== undefined)
                updateData.rejection_reason = rejection_reason;
            if (delegated_to !== undefined)
                updateData.delegated_to = normalizedDepartmentId;
            const { data, error } = await db_1.supabase
                .from('reports')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw error;
            if (status === 'Action Taken' && normalizedDepartmentId !== null) {
                const { data: existingOpenTask } = await db_1.supabase
                    .from('tasks')
                    .select('id, status')
                    .eq('related_report_id', id)
                    .neq('status', 'Completed')
                    .limit(1);
                if (!existingOpenTask || existingOpenTask.length === 0) {
                    const taskId = `TSK-${crypto_1.default.randomUUID().slice(0, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;
                    const priority = (existingReport.urgency || 'Medium').charAt(0).toUpperCase() + (existingReport.urgency || 'Medium').slice(1).toLowerCase();
                    const assigneeRole = assigned_role ? String(assigned_role) : '';
                    const assignedOfficerId = assigneeRole === 'workforce' ? assigned_to : null;
                    const { error: taskCreateError } = await db_1.supabase
                        .from('tasks')
                        .insert([{
                            id: taskId,
                            title: existingReport.title,
                            location: existingReport.location,
                            priority,
                            status: 'Pending',
                            assigned_to: assignedOfficerId,
                            delegated_to: assignedOfficerId,
                            related_report_id: id,
                            created_by: req.user?.id || admin_id || null,
                        }]);
                    if (taskCreateError) {
                        console.error('Failed to create workflow task from report:', taskCreateError);
                    }
                }
            }
            // Add to timeline
            if (notes || status) {
                let timelineNotes = notes || `Status changed to ${status}`;
                if (status === 'Action Taken' && normalizedDepartmentId !== null) {
                    timelineNotes = `Report approved and delegated to ${delegatedDepartmentName || `department ${normalizedDepartmentId}`}.`;
                }
                await db_1.supabase.from('report_timeline').insert([{
                        report_id: id,
                        status,
                        notes: timelineNotes,
                        created_by: admin_id
                    }]);
            }
            return res.status(200).json({ message: 'Report updated', data });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
};
