import { Request, Response } from 'express';
import { supabase } from '../config/db';
import { persistImageInputs } from '../utils/mediaStorage';
import { sendReportTrackingEmail } from '../utils/emailService';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'seebu-super-secret-key-change-me';

async function getAdminMunicipality(adminId: string) {
  const { data, error } = await supabase
    .from('admins')
    .select('municipality_id')
    .eq('id', adminId)
    .maybeSingle();

  if (error) throw error;
  return data?.municipality_id || null;
}

export const reportController = {
  // CREATE REPORT
  async createReport(req: Request, res: Response) {
    try {
      const {
        id, // Frontend can send UUID or we can generate logic (e.g. 'RPT-...')
        reporter_id,
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
        reporter_name,
        reporter_email,
        reporter_phone,
        photos // Expected as array of public URLs String[]
      } = req.body;

      // Best-effort identity fallback: if Authorization exists, trust token identity for client linkage.
      const authHeader = req.headers.authorization;
      let tokenUserId: string | null = null;
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const token = authHeader.split(' ')[1];
          const decoded = jwt.verify(token, JWT_SECRET) as any;
          if (decoded?.id && decoded?.role === 'client') {
            tokenUserId = decoded.id;
          }
        } catch {
          tokenUserId = null;
        }
      }

      const effectiveReporterId = reporter_id || tokenUserId;
      let effectiveReporterName = reporter_name;
      let effectiveReporterEmail = reporter_email;
      let effectiveReporterPhone = reporter_phone;

      if (effectiveReporterId && (!effectiveReporterName || !effectiveReporterEmail || !effectiveReporterPhone)) {
        const { data: reporterProfile } = await supabase
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
      const reportId = id || `RPT-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`;

      // 1. Insert into reports
      const { data: report, error } = await supabase
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

      if (error) throw error;

      // 2. Insert into report_photos if photo URLs exist
      if (photos && Array.isArray(photos) && photos.length > 0) {
        const storedPhotoUrls = await persistImageInputs(photos as string[], `reports/${reportId}/initial`);
        const photoInserts = storedPhotoUrls.map((url: string) => ({
          report_id: reportId,
          photo_url: url,
          is_completion_photo: false
        }));

        const { error: photoErr } = await supabase
          .from('report_photos')
          .insert(photoInserts);
        
        if (photoErr) console.error("Error inserting photos:", photoErr);
      }

        // 3. Add to timeline
        await supabase.from('report_timeline').insert([{
          report_id: reportId,
          status: 'In Review',
          notes: 'Report created and submitted.'
        }]);

        // 4. Send tracking email to reporters who provided an email
        let emailSent = false;
        const emailUsed = effectiveReporterEmail || null;

        if (emailUsed) {
          try {
            await sendReportTrackingEmail(
              emailUsed,
              effectiveReporterName || 'Anonymous User',
              reportId,
              title
            );
            emailSent = true;
          } catch (emailErr) {
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
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  // READ REPORTS
  async getReports(req: Request, res: Response) {
    try {
      const { municipality_id, status, reporter_id, reporter_email } = req.query;
      const reporterIdParam = reporter_id ? String(reporter_id).trim() : '';

      const baseSelect = `
        *,
        municipalities(name),
        barangays(name),
        report_photos(photo_url, is_completion_photo)
      `;

      const applyBaseFilters = (query: any, options?: { ignoreStatus?: boolean }) => {
        let q = query;
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

      const runQuery = async (extraFilter?: (query: any) => any, options?: { ignoreStatus?: boolean }) => {
        let q = supabase
          .from('reports')
          .select(baseSelect)
          .order('created_at', { ascending: false });
        q = applyBaseFilters(q, options);
        if (extraFilter) {
          q = extraFilter(q);
        }
        const { data, error } = await q;
        if (error) throw error;
        return data || [];
      };

      const emailValue = reporter_email ? String(reporter_email).trim() : '';
      let tokenClientId = '';

      if (!reporterIdParam) {
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
          try {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET) as any;
            if (decoded?.role === 'client' && decoded?.id) {
              tokenClientId = String(decoded.id);
            }
          } catch {
            tokenClientId = '';
          }
        }
      }

      const effectiveReporterId = reporterIdParam || tokenClientId;
      const isReporterScoped = Boolean(effectiveReporterId || emailValue);

      let data: any[] = [];
      if (effectiveReporterId && emailValue) {
        const [byId, byEmail] = await Promise.all([
          runQuery((q) => q.eq('reporter_id', effectiveReporterId), { ignoreStatus: isReporterScoped }),
          runQuery((q) => q.ilike('reporter_email', emailValue), { ignoreStatus: isReporterScoped }),
        ]);

        const merged = new Map<string, any>();
        [...byId, ...byEmail].forEach((report: any) => {
          if (report?.id) {
            merged.set(report.id, report);
          }
        });
        data = Array.from(merged.values()).sort(
          (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      } else if (effectiveReporterId) {
        data = await runQuery((q) => q.eq('reporter_id', effectiveReporterId), { ignoreStatus: isReporterScoped });
      } else if (emailValue) {
        data = await runQuery((q) => q.ilike('reporter_email', emailValue), { ignoreStatus: isReporterScoped });
      } else {
        data = await runQuery();
      }

      const completerIds = Array.from(
        new Set(
          (data || [])
            .map((report: any) => report?.completed_by)
            .filter((value: any) => typeof value === 'string' && value.trim().length > 0)
        )
      );

      if (completerIds.length > 0) {
        const [officersRes, workforceAdminsRes, adminsRes] = await Promise.all([
          supabase
            .from('workforce_officers')
            .select('id, full_name, department_id')
            .in('id', completerIds),
          supabase
            .from('workforce_admins')
            .select('id, full_name, department_id')
            .in('id', completerIds),
          supabase
            .from('admins')
            .select('id, full_name, department_id')
            .in('id', completerIds),
        ]);

        const officers = officersRes.data || [];
        const workforceAdmins = workforceAdminsRes.data || [];
        const admins = adminsRes.data || [];

        const allCompleters = [...officers, ...workforceAdmins, ...admins];
        const departmentIds = Array.from(
          new Set(
            allCompleters
              .map((person: any) => person?.department_id)
              .filter((value: any) => Number.isInteger(Number(value)) && Number(value) > 0)
              .map((value: any) => Number(value))
          )
        );

        const departmentNameById = new Map<number, string>();
        if (departmentIds.length > 0) {
          const { data: departments } = await supabase
            .from('departments')
            .select('id, name')
            .in('id', departmentIds);

          (departments || []).forEach((department: any) => {
            if (department?.id && department?.name) {
              departmentNameById.set(Number(department.id), department.name);
            }
          });
        }

        const completerById = new Map<string, { name: string; departmentName: string | null }>();
        allCompleters.forEach((person: any) => {
          if (!person?.id) return;
          completerById.set(String(person.id), {
            name: person.full_name || 'Unknown',
            departmentName: person.department_id
              ? (departmentNameById.get(Number(person.department_id)) || null)
              : null,
          });
        });

        data = data.map((report: any) => {
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
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  // GET SINGLE REPORT BY ID
  async getReportById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
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
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  // UPDATE REPORT STATUS
    async updateReportStatus(req: Request, res: Response) {
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

      const { data: existingReport, error: reportLookupError } = await supabase
        .from('reports')
        .select('id, title, location, urgency, municipality_id')
        .eq('id', id)
        .single();

      if (reportLookupError || !existingReport) {
        return res.status(404).json({ error: 'Report not found' });
      }

      let delegatedDepartmentName: string | null = null;

      if (normalizedDepartmentId !== null) {
        const { data: department, error: departmentError } = await supabase
          .from('departments')
          .select('id, municipality_id, name')
          .eq('id', normalizedDepartmentId)
          .maybeSingle();

        if (departmentError) throw departmentError;
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
        const { data: assignee, error: assigneeError } = await supabase
          .from(assigneeTable)
          .select('id, department_id, status')
          .eq('id', assigned_to)
          .maybeSingle();

        if (assigneeError) throw assigneeError;
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

      const updateData: any = { updated_at: new Date() };
      if (status !== undefined) updateData.status = status;
      if (rejection_reason !== undefined) updateData.rejection_reason = rejection_reason;
      if (delegated_to !== undefined) updateData.delegated_to = normalizedDepartmentId;

      const { data, error } = await supabase
        .from('reports')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (status === 'Action Taken' && normalizedDepartmentId !== null) {
        const { data: existingOpenTask } = await supabase
          .from('tasks')
          .select('id, status')
          .eq('related_report_id', id)
          .neq('status', 'Completed')
          .limit(1);

        if (!existingOpenTask || existingOpenTask.length === 0) {
          const taskId = `TSK-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`;
          const priority = (existingReport.urgency || 'Medium').charAt(0).toUpperCase() + (existingReport.urgency || 'Medium').slice(1).toLowerCase();
          const assigneeRole = assigned_role ? String(assigned_role) : '';
          const assignedOfficerId = assigneeRole === 'workforce' ? assigned_to : null;

          const { error: taskCreateError } = await supabase
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

        await supabase.from('report_timeline').insert([{
          report_id: id,
          status,
          notes: timelineNotes,
          created_by: admin_id
        }]);
      }

      return res.status(200).json({ message: 'Report updated', data });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
};
