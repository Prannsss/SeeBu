import { Request, Response } from 'express';
import { supabase } from '../config/db';
import { serverErrorMessage } from '../utils/errorResponse';
import { persistImageInputs, isTrustedStorageUrl } from '../utils/mediaStorage';
import { notifyReportStatusChange } from '../utils/reportNotifications';
import { invalidateWorkflowCaches } from '../utils/cache';

const MAX_PROOF_PHOTO_BYTES = 8 * 1024 * 1024;
// Statuses settable via PUT. 'Completed' is deliberately absent: it requires proof (completeTask).
const STAFF_TASK_STATUSES = ['Pending', 'Assigned', 'Accepted', 'In Progress'];
const OFFICER_TASK_STATUSES = ['Accepted', 'In Progress'];

export const taskController = {
  // READ TASKS
  async getTasks(req: Request, res: Response) {
    try {
      const { status, updated_after } = req.query;
      const role = req.user?.role;

      // Scope by role: officers see only their own tasks, workforce admins only their department's,
      // admins only their municipality's. Query params can narrow the scope but never widen it.
      const assignedTo = role === 'workforce' ? req.user.id : req.query.assigned_to;
      const departmentId = role === 'workforce-admin' ? req.user.department_id : req.query.delegated_to;
      const municipalityId = role === 'admin' ? req.user.municipality_id : null;
      if ((role === 'workforce-admin' && !departmentId) || (role === 'admin' && !municipalityId)) {
        return res.status(200).json({ data: [] });
      }

      // Filtering on the linked report needs an inner join — done in this one query instead of
      // first fetching report ids and sending them back as a (growing) IN list.
      const filterByReport = Boolean(departmentId || municipalityId);
      let query = supabase
        .from('tasks')
        .select(`
          *,
          related_report:reports${filterByReport ? '!inner' : ''}(
            id,
            title,
            description,
            urgency,
            location,
            landmark,
            delegated_to,
            municipality_id,
            municipalities(name),
            barangays(name),
            report_photos(photo_url, is_completion_photo)
          )
        `)
        .order('created_at', { ascending: false });

      if (updated_after) {
        query = query.gte('updated_at', new Date(String(updated_after)).toISOString());
      }

      if (assignedTo) query = query.eq('assigned_to', String(assignedTo));
      if (departmentId) query = query.eq('related_report.delegated_to', String(departmentId));
      if (municipalityId) query = query.eq('related_report.municipality_id', String(municipalityId));
      if (status) query = query.eq('status', String(status));

      const { data, error } = await query;
      if (error) throw error;

      return res.status(200).json({ data });
    } catch (err: any) {
      return res.status(500).json({ error: serverErrorMessage(err) });
    }
  },

  // UPDATE TASK STATUS (Assigned -> Accepted -> Completed)
  async updateTaskStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, assigned_to } = req.body;
      let assignedOfficerName: string | null = null;

      // Completion only happens through POST /:id/complete, which requires proof photos.
      const allowedStatuses = req.user?.role === 'workforce' ? OFFICER_TASK_STATUSES : STAFF_TASK_STATUSES;
      if (status !== undefined && !allowedStatuses.includes(status)) {
        return res.status(400).json({ error: `Status must be one of: ${allowedStatuses.join(', ')}` });
      }

      // Workforce admins may only manage tasks delegated to their own department.
      if (req.user?.role === 'workforce-admin') {
        const { data: scopedTask, error: scopedTaskError } = await supabase
          .from('tasks')
          .select('related_report:reports(delegated_to)')
          .eq('id', id)
          .maybeSingle();

        if (scopedTaskError) throw scopedTaskError;
        if (!scopedTask) {
          return res.status(404).json({ error: 'Task not found' });
        }
        const taskDepartment = (scopedTask as any).related_report?.delegated_to;
        if (!req.user.department_id || Number(taskDepartment) !== Number(req.user.department_id)) {
          return res.status(403).json({ error: 'You can only manage tasks delegated to your department' });
        }
      }

      // Officers may only update their own tasks and cannot reassign them.
      if (req.user?.role === 'workforce') {
        const { data: ownTask, error: ownTaskError } = await supabase
          .from('tasks')
          .select('assigned_to')
          .eq('id', id)
          .maybeSingle();

        if (ownTaskError) throw ownTaskError;
        if (!ownTask) {
          return res.status(404).json({ error: 'Task not found' });
        }
        if (ownTask.assigned_to !== req.user.id) {
          return res.status(403).json({ error: 'You can only update tasks assigned to you' });
        }
        if (assigned_to !== undefined) {
          return res.status(403).json({ error: 'Workforce officers cannot reassign tasks' });
        }
      }

      if (assigned_to) {
        const { data: officer, error: officerError } = await supabase
          .from('workforce_officers')
          .select('id, department_id, status, full_name')
          .eq('id', assigned_to)
          .maybeSingle();

        if (officerError) throw officerError;
        if (!officer) {
          return res.status(400).json({ error: 'Assigned officer does not exist' });
        }

        if (officer.status && String(officer.status).toLowerCase() !== 'active') {
          return res.status(400).json({ error: 'Assigned officer is not active' });
        }

        assignedOfficerName = officer.full_name || null;

        if (req.user?.role === 'workforce-admin' && Number(req.user.department_id) !== Number(officer.department_id)) {
          return res.status(403).json({ error: 'You can only assign officers from your own department' });
        }
      }

      const updateData: any = {};
      if (status !== undefined) updateData.status = status;
      if (assigned_to !== undefined) {
        updateData.assigned_to = assigned_to;
        // Keep delegated_to aligned with the selected officer when dispatching from workforce-admin.
        updateData.delegated_to = assigned_to;
      }
      if (status === 'Completed') {
        updateData.completed_at = new Date();
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (status || assigned_to) {
        await supabase.from('task_timeline').insert([{
          task_id: id,
          status: status || data?.status || 'Updated',
          notes: status ? `Task status changed to ${status}.` : 'Task assignment updated.',
          created_by: req.user?.id
        }]);
      }

      let departmentName: string | null = null;
      let actingOfficerName: string | null = null;
      let previousReportStatus: string | null = null;
      if (data?.related_report_id) {
        const { data: reportRow } = await supabase
          .from('reports')
          .select('delegated_to, status')
          .eq('id', data.related_report_id)
          .maybeSingle();

        previousReportStatus = reportRow?.status || null;
        if (reportRow?.delegated_to) {
          const { data: departmentRow } = await supabase
            .from('departments')
            .select('name')
            .eq('id', reportRow.delegated_to)
            .maybeSingle();
          departmentName = departmentRow?.name || null;
        }
      }

      if (req.user?.role === 'workforce') {
        const { data: actingOfficer } = await supabase
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

        await supabase
          .from('reports')
          .update({ status: mappedReportStatus, updated_at: new Date() })
          .eq('id', data.related_report_id);

        if (mappedReportStatus !== previousReportStatus) {
          notifyReportStatusChange(data.related_report_id, mappedReportStatus);
        }

        let reportTimelineNotes = `Task workflow updated to ${status}.`;
        if (status === 'Accepted') {
          if (req.user?.role === 'workforce') {
            reportTimelineNotes = `Task accepted by workforce officer${actingOfficerName ? ` ${actingOfficerName}` : ''}${departmentName ? ` (${departmentName})` : ''}.`;
          } else {
            reportTimelineNotes = `Task accepted by workforce admin${departmentName ? ` from ${departmentName}` : ''}.`;
          }
        }
        if (status === 'Assigned') {
          reportTimelineNotes = `Task assigned to ${assignedOfficerName || 'a workforce officer'}${departmentName ? ` (${departmentName})` : ''}.`;
        }
        if (status === 'Pending') {
          reportTimelineNotes = `Task pending acceptance${departmentName ? ` by ${departmentName}` : ''}.`;
        }

        await supabase.from('report_timeline').insert([{
          report_id: data.related_report_id,
          status,
          notes: reportTimelineNotes,
          created_by: req.user?.id
        }]);
      }

      await invalidateWorkflowCaches();

      return res.status(200).json({ message: 'Task updated successfully', data });
    } catch (err: any) {
      return res.status(500).json({ error: serverErrorMessage(err) });
    }
  },


  // COMPLETE TASK WITH PROOF
  async completeTask(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { photo_url, photo_urls } = req.body;

      const normalizedPhotoInputs: string[] = Array.isArray(photo_urls)
        ? photo_urls.filter((item: any) => typeof item === 'string' && item.trim().length > 0)
        : (photo_url && typeof photo_url === 'string' ? [photo_url] : []);

      if (normalizedPhotoInputs.length === 0) {
        return res.status(400).json({ error: 'At least one proof photo is required' });
      }

      if (normalizedPhotoInputs.length > 5) {
        return res.status(400).json({ error: 'You can upload up to 5 proof photos only' });
      }

      for (const val of normalizedPhotoInputs) {
        if (val.startsWith('data:image/')) {
          if (val.length * 0.75 > MAX_PROOF_PHOTO_BYTES) {
            return res.status(400).json({ error: 'Each proof photo must be under 8MB' });
          }
        } else if (val.startsWith('http://') || val.startsWith('https://')) {
          if (!isTrustedStorageUrl(val)) {
            return res.status(400).json({ error: 'Proof photo URL must be hosted on our storage domain' });
          }
        } else {
          return res.status(400).json({ error: 'Proof photo must be a base64 image or a storage URL' });
        }
      }

      const { data: existingTask, error: taskLookupError } = await supabase
        .from('tasks')
        .select('id, assigned_to, related_report_id, status')
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

      // Idempotency: SW replays / client retries must not re-complete or duplicate photos.
      if (existingTask.status === 'Completed') {
        return res.status(409).json({ error: 'This task is already completed.' });
      }

      // Upload proof first; the task is only completed once at least one photo is stored.
      const stored = await persistImageInputs(normalizedPhotoInputs, `reports/${existingTask.related_report_id || id}/completion`);
      if (stored.length === 0) {
        return res.status(502).json({ error: "We couldn't upload your proof photos. Please try again." });
      }

      // Update Task status to Completed
      const { data: task, error } = await supabase
        .from('tasks')
        .update({ 
          status: 'Completed', 
          completed_at: new Date()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const { error: taskPhotoErr } = await supabase.from('task_proof_photos').insert(stored.map((url) => ({
        task_id: id,
        photo_url: url
      })));

      if (taskPhotoErr) {
        console.error('Error inserting task proof photos:', taskPhotoErr);
      }

      if (existingTask.related_report_id) {
        const { error: reportPhotoErr } = await supabase.from('report_photos').insert(stored.map((url) => ({
          report_id: existingTask.related_report_id,
          photo_url: url,
          is_completion_photo: true
        })));

        if (reportPhotoErr) {
          console.error('Error inserting report completion photos:', reportPhotoErr);
        }
      }

      await supabase.from('task_timeline').insert([{
        task_id: id,
        status: 'Completed',
        notes: 'Task marked as completed with proof submission.',
        created_by: req.user?.id
      }]);

      if (existingTask.related_report_id) {
        let completingOfficerName: string | null = null;
        const { data: completingOfficer } = await supabase
          .from('workforce_officers')
          .select('full_name')
          .eq('id', req.user.id)
          .maybeSingle();
        completingOfficerName = completingOfficer?.full_name || null;

        const { error: reportStatusErr } = await supabase
          .from('reports')
          .update({
            status: 'Resolved',
            completed_by: req.user?.id,
            updated_at: new Date()
          })
          .eq('id', existingTask.related_report_id);

        if (reportStatusErr) {
          console.error('Error updating linked report status:', reportStatusErr);
        } else {
          notifyReportStatusChange(existingTask.related_report_id, 'Resolved');
        }

        await supabase.from('report_timeline').insert([{
          report_id: existingTask.related_report_id,
          status: 'Completed',
          notes: `Task completed by workforce officer${completingOfficerName ? ` ${completingOfficerName}` : ''} and marked as resolved.`,
          created_by: req.user?.id
        }]);
      }

      await invalidateWorkflowCaches();

      return res.status(200).json({ message: 'Task completed successfully', data: task });
    } catch (err: any) {
      return res.status(500).json({ error: serverErrorMessage(err) });
    }
  }
};
