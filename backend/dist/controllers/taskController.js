"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskController = void 0;
const db_1 = require("../config/db");
const mediaStorage_1 = require("../utils/mediaStorage");
exports.taskController = {
    // READ TASKS
    async getTasks(req, res) {
        try {
            const { assigned_to, delegated_to, status } = req.query;
            let query = db_1.supabase
                .from('tasks')
                .select(`
          *,
          related_report:reports(
            id,
            title,
            description,
            urgency,
            location,
            landmark,
            municipalities(name),
            barangays(name),
            report_photos(photo_url, is_completion_photo)
          )
        `)
                .order('created_at', { ascending: false });
            if (assigned_to)
                query = query.eq('assigned_to', assigned_to);
            if (delegated_to) {
                const { data: delegatedReports, error: delegatedReportsError } = await db_1.supabase
                    .from('reports')
                    .select('id')
                    .eq('delegated_to', delegated_to);
                if (delegatedReportsError)
                    throw delegatedReportsError;
                const reportIds = (delegatedReports || []).map((report) => report.id);
                if (reportIds.length === 0) {
                    return res.status(200).json({ data: [] });
                }
                query = query.in('related_report_id', reportIds);
            }
            if (status)
                query = query.eq('status', status);
            const { data, error } = await query;
            if (error)
                throw error;
            return res.status(200).json({ data });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    },
    // UPDATE TASK STATUS (Assigned -> Accepted -> Completed)
    async updateTaskStatus(req, res) {
        try {
            const { id } = req.params;
            const { status, assigned_to } = req.body;
            let assignedOfficerName = null;
            if (assigned_to) {
                const { data: officer, error: officerError } = await db_1.supabase
                    .from('workforce_officers')
                    .select('id, department_id, status, full_name')
                    .eq('id', assigned_to)
                    .maybeSingle();
                if (officerError)
                    throw officerError;
                if (!officer) {
                    return res.status(400).json({ error: 'Assigned officer does not exist' });
                }
                if (officer.status && String(officer.status).toLowerCase() !== 'active') {
                    return res.status(400).json({ error: 'Assigned officer is not active' });
                }
                assignedOfficerName = officer.full_name || null;
                if (req.user?.role === 'workforce-admin') {
                    const { data: workforceAdmin, error: workforceAdminError } = await db_1.supabase
                        .from('workforce_admins')
                        .select('department_id')
                        .eq('id', req.user.id)
                        .maybeSingle();
                    if (workforceAdminError)
                        throw workforceAdminError;
                    if (!workforceAdmin?.department_id || Number(workforceAdmin.department_id) !== Number(officer.department_id)) {
                        return res.status(403).json({ error: 'You can only assign officers from your own department' });
                    }
                }
            }
            const updateData = {};
            if (status !== undefined)
                updateData.status = status;
            if (assigned_to !== undefined) {
                updateData.assigned_to = assigned_to;
                // Keep delegated_to aligned with the selected officer when dispatching from workforce-admin.
                updateData.delegated_to = assigned_to;
            }
            if (status === 'Completed') {
                updateData.completed_at = new Date();
            }
            const { data, error } = await db_1.supabase
                .from('tasks')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw error;
            if (status || assigned_to) {
                await db_1.supabase.from('task_timeline').insert([{
                        task_id: id,
                        status: status || data?.status || 'Updated',
                        notes: status ? `Task status changed to ${status}.` : 'Task assignment updated.',
                        created_by: req.user?.id
                    }]);
            }
            let departmentName = null;
            let actingOfficerName = null;
            if (data?.related_report_id) {
                const { data: reportRow } = await db_1.supabase
                    .from('reports')
                    .select('delegated_to')
                    .eq('id', data.related_report_id)
                    .maybeSingle();
                if (reportRow?.delegated_to) {
                    const { data: departmentRow } = await db_1.supabase
                        .from('departments')
                        .select('name')
                        .eq('id', reportRow.delegated_to)
                        .maybeSingle();
                    departmentName = departmentRow?.name || null;
                }
            }
            if (req.user?.role === 'workforce') {
                const { data: actingOfficer } = await db_1.supabase
                    .from('workforce_officers')
                    .select('full_name')
                    .eq('id', req.user.id)
                    .maybeSingle();
                actingOfficerName = actingOfficer?.full_name || null;
            }
            if ((status === 'Assigned' || status === 'Accepted' || status === 'Pending') && data?.related_report_id) {
                const mappedReportStatus = status === 'Pending'
                    ? 'Action Taken'
                    : 'In Progress';
                await db_1.supabase
                    .from('reports')
                    .update({ status: mappedReportStatus, updated_at: new Date() })
                    .eq('id', data.related_report_id);
                let reportTimelineNotes = `Task workflow updated to ${status}.`;
                if (status === 'Accepted') {
                    if (req.user?.role === 'workforce') {
                        reportTimelineNotes = `Task accepted by workforce officer${actingOfficerName ? ` ${actingOfficerName}` : ''}${departmentName ? ` (${departmentName})` : ''}.`;
                    }
                    else {
                        reportTimelineNotes = `Task accepted by workforce admin${departmentName ? ` from ${departmentName}` : ''}.`;
                    }
                }
                if (status === 'Assigned') {
                    reportTimelineNotes = `Task assigned to ${assignedOfficerName || 'a workforce officer'}${departmentName ? ` (${departmentName})` : ''}.`;
                }
                if (status === 'Pending') {
                    reportTimelineNotes = `Task pending acceptance${departmentName ? ` by ${departmentName}` : ''}.`;
                }
                await db_1.supabase.from('report_timeline').insert([{
                        report_id: data.related_report_id,
                        status,
                        notes: reportTimelineNotes,
                        created_by: req.user?.id
                    }]);
            }
            return res.status(200).json({ message: 'Task updated successfully', data });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    },
    // COMPLETE TASK WITH PROOF
    async completeTask(req, res) {
        try {
            const { id } = req.params;
            const { photo_url, photo_urls } = req.body;
            const normalizedPhotoInputs = Array.isArray(photo_urls)
                ? photo_urls.filter((item) => typeof item === 'string' && item.trim().length > 0)
                : (photo_url && typeof photo_url === 'string' ? [photo_url] : []);
            if (normalizedPhotoInputs.length === 0) {
                return res.status(400).json({ error: 'At least one proof photo is required' });
            }
            if (normalizedPhotoInputs.length > 5) {
                return res.status(400).json({ error: 'You can upload up to 5 proof photos only' });
            }
            const { data: existingTask, error: taskLookupError } = await db_1.supabase
                .from('tasks')
                .select('id, assigned_to, related_report_id')
                .eq('id', id)
                .single();
            if (taskLookupError || !existingTask) {
                return res.status(404).json({ error: 'Task not found' });
            }
            if (req.user?.role !== 'workforce') {
                return res.status(403).json({ error: 'Only workforce officers can submit completion proof' });
            }
            if (!existingTask.assigned_to || existingTask.assigned_to !== req.user?.id) {
                return res.status(403).json({ error: 'Only the assigned officer can complete this task' });
            }
            // Update Task status to Completed
            const { data: task, error } = await db_1.supabase
                .from('tasks')
                .update({
                status: 'Completed',
                completed_at: new Date()
            })
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw error;
            const storedProofUrls = [];
            for (const inputUrl of normalizedPhotoInputs) {
                let storedProofUrl = inputUrl;
                try {
                    const storedProof = await (0, mediaStorage_1.persistImageInput)(inputUrl, `reports/${existingTask.related_report_id || id}/completion`);
                    storedProofUrl = storedProof.storedUrl;
                }
                catch (storageErr) {
                    console.error('Completion proof upload failed, using original value:', storageErr);
                }
                storedProofUrls.push(storedProofUrl);
            }
            const { error: taskPhotoErr } = await db_1.supabase
                .from('task_proof_photos')
                .insert(storedProofUrls.map((url) => ({
                task_id: id,
                photo_url: url
            })));
            if (taskPhotoErr) {
                console.error('Error inserting task proof photos:', taskPhotoErr);
            }
            if (existingTask.related_report_id) {
                const { error: reportPhotoErr } = await db_1.supabase
                    .from('report_photos')
                    .insert(storedProofUrls.map((url) => ({
                    report_id: existingTask.related_report_id,
                    photo_url: url,
                    is_completion_photo: true
                })));
                if (reportPhotoErr) {
                    console.error('Error inserting report completion photos:', reportPhotoErr);
                }
            }
            await db_1.supabase.from('task_timeline').insert([{
                    task_id: id,
                    status: 'Completed',
                    notes: 'Task marked as completed with proof submission.',
                    created_by: req.user?.id
                }]);
            if (existingTask.related_report_id) {
                let completingOfficerName = null;
                const { data: completingOfficer } = await db_1.supabase
                    .from('workforce_officers')
                    .select('full_name')
                    .eq('id', req.user.id)
                    .maybeSingle();
                completingOfficerName = completingOfficer?.full_name || null;
                const { error: reportStatusErr } = await db_1.supabase
                    .from('reports')
                    .update({
                    status: 'Resolved',
                    completed_by: req.user?.id,
                    updated_at: new Date()
                })
                    .eq('id', existingTask.related_report_id);
                if (reportStatusErr) {
                    console.error('Error updating linked report status:', reportStatusErr);
                }
                await db_1.supabase.from('report_timeline').insert([{
                        report_id: existingTask.related_report_id,
                        status: 'Completed',
                        notes: `Task completed by workforce officer${completingOfficerName ? ` ${completingOfficerName}` : ''} and marked as resolved.`,
                        created_by: req.user?.id
                    }]);
            }
            // If tied to a report, optionally we could log to report_timeline here
            return res.status(200).json({ message: 'Task completed successfully', data: task });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
};
