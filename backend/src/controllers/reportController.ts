import { Request, Response } from 'express';
import { supabase } from '../config/db';

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

      // Handle custom ID generation if not provided
      const reportId = id || `RPT-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`;

      // 1. Insert into reports
      const { data: report, error } = await supabase
        .from('reports')
        .insert([{
          id: reportId,
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
          status: 'In Review'
        }])
        .select()
        .single();

      if (error) throw error;

      // 2. Insert into report_photos if photo URLs exist
      if (photos && Array.isArray(photos) && photos.length > 0) {
        const photoInserts = photos.map((url: string) => ({
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

      return res.status(201).json({ message: 'Report created successfully', data: report });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  // READ REPORTS
  async getReports(req: Request, res: Response) {
    try {
      const { municipality_id, status, reporter_id } = req.query;

      let query = supabase
        .from('reports')
        .select(`
          *,
          municipalities(name),
          barangays(name),
          report_photos(photo_url, is_completion_photo)
        `)
        .order('created_at', { ascending: false });

      if (municipality_id) query = query.eq('municipality_id', municipality_id);
      if (status) query = query.eq('status', status);
      if (reporter_id) query = query.eq('reporter_id', reporter_id);

      const { data, error } = await query;
      if (error) throw error;

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
      const { status, notes, admin_id, rejection_reason, delegated_to } = req.body;

      const updateData: any = { updated_at: new Date() };
      if (status !== undefined) updateData.status = status;
      if (rejection_reason !== undefined) updateData.rejection_reason = rejection_reason;
      if (delegated_to !== undefined) updateData.delegated_to = delegated_to;

      const { data, error } = await supabase
        .from('reports')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Add to timeline
      if (notes || status) {
        await supabase.from('report_timeline').insert([{
          report_id: id,
          status,
          notes: notes || `Status changed to ${status}`,
          created_by: admin_id
        }]);
      }

      return res.status(200).json({ message: 'Report updated', data });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
};
