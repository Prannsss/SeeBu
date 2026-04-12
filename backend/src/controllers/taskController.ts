import { Request, Response } from 'express';
import { supabase } from '../config/db';

export const taskController = {
  // READ TASKS
  async getTasks(req: Request, res: Response) {
    try {
      const { assigned_to, delegated_to, status } = req.query;

      let query = supabase
        .from('tasks')
        .select(`
          *,
          related_report:reports(id, title, description)
        `)
        .order('created_at', { ascending: false });

      if (assigned_to) query = query.eq('assigned_to', assigned_to);
      if (delegated_to) query = query.eq('delegated_to', delegated_to);
      if (status) query = query.eq('status', status);

      const { data, error } = await query;
      if (error) throw error;

      return res.status(200).json({ data });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  // UPDATE TASK STATUS (Assigned -> Accepted -> Completed)
  async updateTaskStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, assigned_to } = req.body;

      const updateData: any = {};
      if (status !== undefined) updateData.status = status;
      if (assigned_to !== undefined) updateData.assigned_to = assigned_to;
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

      return res.status(200).json({ message: 'Task updated successfully', data });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },


  // COMPLETE TASK WITH PROOF
  async completeTask(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { remarks, photo_url } = req.body;

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

      // Optionally insert proof photo if provided
      if (photo_url) {
        const { error: photoErr } = await supabase
          .from('task_proof_photos')
          .insert([{
            task_id: id,
            photo_url,
            notes: remarks
          }]);
        
        if (photoErr) console.error("Error inserting task proof photo:", photoErr);
      }

      // If tied to a report, optionally we could log to report_timeline here

      return res.status(200).json({ message: 'Task completed successfully', data: task });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
};
