"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.departmentController = void 0;
const db_1 = require("../config/db");
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
async function getWorkforceAdminScope(workforceAdminId) {
    const { data, error } = await db_1.supabase
        .from('workforce_admins')
        .select('department_id, municipality_id')
        .eq('id', workforceAdminId)
        .maybeSingle();
    if (error)
        throw error;
    return {
        departmentId: data?.department_id ? Number(data.department_id) : null,
        municipalityId: data?.municipality_id || null,
    };
}
async function getWorkforceOfficerScope(workforceOfficerId) {
    const { data, error } = await db_1.supabase
        .from('workforce_officers')
        .select('department_id, municipality_id')
        .eq('id', workforceOfficerId)
        .maybeSingle();
    if (error)
        throw error;
    return {
        departmentId: data?.department_id ? Number(data.department_id) : null,
        municipalityId: data?.municipality_id || null,
    };
}
async function getDepartmentsForRequester(req, explicitMunicipalityId) {
    const role = req.user?.role;
    const userId = req.user?.id;
    let query = db_1.supabase
        .from('departments')
        .select('id, name, municipality_id, department_email')
        .order('name', { ascending: true });
    if (role === 'superadmin') {
        if (explicitMunicipalityId) {
            query = query.eq('municipality_id', explicitMunicipalityId);
        }
    }
    else if (role === 'admin') {
        const municipalityId = await getAdminMunicipality(userId);
        if (!municipalityId)
            return [];
        query = query.eq('municipality_id', municipalityId);
    }
    else if (role === 'workforce-admin') {
        const scope = await getWorkforceAdminScope(userId);
        if (!scope.departmentId)
            return [];
        query = query.eq('id', scope.departmentId);
    }
    else if (role === 'workforce') {
        const scope = await getWorkforceOfficerScope(userId);
        if (!scope.departmentId)
            return [];
        query = query.eq('id', scope.departmentId);
    }
    else {
        return [];
    }
    const { data, error } = await query;
    if (error)
        throw error;
    return (data || []);
}
exports.departmentController = {
    async getDepartments(req, res) {
        try {
            const municipalityId = req.query.municipality_id ? String(req.query.municipality_id) : undefined;
            const includePersonnel = String(req.query.include_personnel || '').toLowerCase() === 'true';
            const departments = await getDepartmentsForRequester(req, municipalityId);
            if (!includePersonnel || departments.length === 0) {
                return res.status(200).json({ data: departments });
            }
            const departmentIds = departments.map((d) => d.id);
            const [{ data: wfAdmins, error: wfAdminError }, { data: officers, error: officerError }] = await Promise.all([
                db_1.supabase
                    .from('workforce_admins')
                    .select('id, full_name, email, department_id, status')
                    .in('department_id', departmentIds),
                db_1.supabase
                    .from('workforce_officers')
                    .select('id, full_name, email, department_id, status, role')
                    .in('department_id', departmentIds),
            ]);
            if (wfAdminError)
                throw wfAdminError;
            if (officerError)
                throw officerError;
            const data = departments.map((department) => {
                const adminsInDepartment = (wfAdmins || [])
                    .filter((item) => Number(item.department_id) === department.id)
                    .map((item) => ({
                    id: item.id,
                    full_name: item.full_name,
                    email: item.email,
                    status: item.status,
                    role: 'workforce-admin',
                }));
                const officersInDepartment = (officers || [])
                    .filter((item) => Number(item.department_id) === department.id)
                    .map((item) => ({
                    id: item.id,
                    full_name: item.full_name,
                    email: item.email,
                    status: item.status,
                    role: 'workforce',
                    officer_role: item.role,
                }));
                return {
                    ...department,
                    personnel: [...adminsInDepartment, ...officersInDepartment],
                };
            });
            return res.status(200).json({ data });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    },
    async getDepartmentPersonnel(req, res) {
        try {
            const departmentId = Number(req.params.id);
            if (!Number.isInteger(departmentId) || departmentId <= 0) {
                return res.status(400).json({ error: 'Invalid department id' });
            }
            const departments = await getDepartmentsForRequester(req);
            const isAllowed = departments.some((d) => d.id === departmentId);
            if (!isAllowed) {
                return res.status(403).json({ error: 'Forbidden: department out of scope' });
            }
            const [{ data: wfAdmins, error: wfAdminError }, { data: officers, error: officerError }] = await Promise.all([
                db_1.supabase
                    .from('workforce_admins')
                    .select('id, full_name, email, department_id, status')
                    .eq('department_id', departmentId),
                db_1.supabase
                    .from('workforce_officers')
                    .select('id, full_name, email, department_id, status, role')
                    .eq('department_id', departmentId),
            ]);
            if (wfAdminError)
                throw wfAdminError;
            if (officerError)
                throw officerError;
            const personnel = [
                ...(wfAdmins || []).map((item) => ({
                    id: item.id,
                    full_name: item.full_name,
                    email: item.email,
                    status: item.status,
                    role: 'workforce-admin',
                    department_id: departmentId,
                })),
                ...(officers || []).map((item) => ({
                    id: item.id,
                    full_name: item.full_name,
                    email: item.email,
                    status: item.status,
                    role: 'workforce',
                    officer_role: item.role,
                    department_id: departmentId,
                })),
            ];
            return res.status(200).json({ data: personnel });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    },
};
