import { Request, Response } from 'express';
import { supabase } from '../config/db';

export const locationController = {
  async getLocations(req: Request, res: Response) {
    try {
      // Fetch municipalities and their nested barangays
      const { data: municipalities, error } = await supabase
        .from('municipalities')
        .select(`
          id,
          name,
          barangays (
            id,
            name
          )
        `)
        .order('name');

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ data: municipalities });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
};
