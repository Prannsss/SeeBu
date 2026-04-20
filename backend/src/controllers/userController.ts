import { Request, Response } from 'express';
import { supabase } from '../config/db';

export const userController = {
  async getCurrentUser(req: Request, res: Response) {
    try {
      const userReq = req.user;
      if (!userReq || !userReq.id || !userReq.role) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Map roles to tables
      let tableName = '';
      switch (userReq.role) {
        case 'client': tableName = 'clients'; break;
        case 'admin': tableName = 'admins'; break;
        case 'superadmin': tableName = 'superadmins'; break;
        case 'workforce-admin': tableName = 'workforce_admins'; break;
        case 'workforce': tableName = 'workforce_officers'; break;
        default: return res.status(400).json({ error: 'Invalid user role' });
      }

      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', userReq.id)
        .single();
      
      if (error || !data) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Hide sensitive fields
      const { password_hash, ...userProfile } = data;
      userProfile.role = userReq.role; // Attach generic role
      
      return res.status(200).json({ data: userProfile });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  async updateCurrentUser(req: Request, res: Response) {
    try {
      const userReq = req.user;
      if (!userReq || !userReq.id || !userReq.role) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      let tableName = '';
      switch (userReq.role) {
        case 'client': tableName = 'clients'; break;
        case 'admin': tableName = 'admins'; break;
        case 'superadmin': tableName = 'superadmins'; break;
        case 'workforce-admin': tableName = 'workforce_admins'; break;
        case 'workforce': tableName = 'workforce_officers'; break;
        default: return res.status(400).json({ error: 'Invalid user role' });
      }

      const { full_name, email, contact_number } = req.body;
      const updates: any = {};
      if (full_name !== undefined) updates.full_name = full_name;
      if (email !== undefined) updates.email = email;
      if (contact_number !== undefined) updates.contact_number = contact_number;

      const { error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', userReq.id);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ message: 'Profile updated successfully' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  async getAllUsers(req: Request, res: Response) {
    try {
      const tables = ['clients', 'admins', 'superadmins', 'workforce_admins', 'workforce_officers'];
      let allUsers: any[] = [];
      
      for (const table of tables) {
        // Handle varying column names across tables, carefully alias them
        let selectQuery = 'id, email, status';
        if (table === 'clients' || table === 'admins' || table === 'superadmins' || table === 'workforce_admins' || table === 'workforce_officers') {
            selectQuery += ', full_name';
        }
        if (table === 'admins' || table === 'workforce_admins' || table === 'workforce_officers') {
            const hasMun = table === 'admins';
            if (hasMun) selectQuery += ', municipality_id';
            const hasDept = table === 'workforce_admins' || table === 'workforce_officers';
            if (hasDept) selectQuery += ', department_id';
        }

        const { data: tbData, error } = await supabase.from(table).select(selectQuery).limit(100);
        
        if (tbData) {
          // Fetch municipality names for mapping
          const { data: municipalities } = await supabase.from('municipalities').select('id, name');
          const munNameMap: Record<string, string> = {};
          (municipalities || []).forEach((m: any) => {
            munNameMap[m.id] = m.name;
          });

          allUsers = [...allUsers, ...tbData.map((u: any) => {
            // Format area: convert 'cebu-city' to 'Cebu City'
            let areaDisplay = 'Global';
            if (u.municipality_id) {
              const rawName = munNameMap[u.municipality_id] || u.municipality_id;
              areaDisplay = rawName.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
            } else if (u.department_id) {
              areaDisplay = u.department_id;
            }
            
            return {
              id: u.id,
              name: u.full_name || 'Unknown',
              email: u.email,
              role: table === 'clients' ? 'CLIENT' : 
                    table === 'admins' ? 'ADMIN' : 
                    table === 'superadmins' ? 'SUPERADMIN' : 
                    table === 'workforce_admins' ? 'WORKFORCE_ADMIN' : 'WORKFORCE_OFFICER',
              area: areaDisplay,
              area_id: u.municipality_id || null,
              status: u.status || 'Active'
            };
          })];
        }
      }
      
      return res.status(200).json({ data: allUsers });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  async deleteCurrentUser(req: Request, res: Response) {
    try {
      const userReq = req.user;
      if (!userReq || !userReq.id || !userReq.role) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      let tableName = '';
      switch (userReq.role) {
        case 'client': tableName = 'clients'; break;
        case 'admin': tableName = 'admins'; break;
        case 'superadmin': tableName = 'superadmins'; break;
        case 'workforce-admin': tableName = 'workforce_admins'; break;
        case 'workforce': tableName = 'workforce_officers'; break;
        default: return res.status(400).json({ error: 'Invalid user role' });
      }

      // Soft delete by updating status to 'Inactive' or hard delete
      // Using soft delete for data integrity
      const { error } = await supabase
        .from(tableName)
        .update({ status: 'Inactive' })
        .eq('id', userReq.id);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ message: 'Account deleted successfully' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
};
