import { Request, Response } from 'express';
import { supabase } from '../config/db';
import { serverErrorMessage } from '../utils/errorResponse';
import { emailExists } from '../utils/accounts';
import { cacheDel, cacheDelPrefix, authStatusKey } from '../utils/cache';
import { fetchAllRows } from '../utils/pagination';

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
      return res.status(500).json({ error: serverErrorMessage(err) });
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

      if (email && await emailExists(email, userReq.id)) {
        return res.status(409).json({ error: 'This email is already in use.' });
      }

      const { error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', userReq.id);

      if (error) {
        return res.status(500).json({ error: serverErrorMessage(error) });
      }

      await cacheDelPrefix('users:');
      return res.status(200).json({ message: 'Profile updated successfully' });
    } catch (err: any) {
      return res.status(500).json({ error: serverErrorMessage(err) });
    }
  },

  async getAllUsers(req: Request, res: Response) {
    try {
      const tables = ['clients', 'admins', 'superadmins', 'workforce_admins', 'workforce_officers'];
      let allUsers: any[] = [];

      // Fetch municipality and department names once for mapping
      const [{ data: municipalities }, { data: departments }] = await Promise.all([
        supabase.from('municipalities').select('id, name'),
        supabase.from('departments').select('id, name'),
      ]);
      const munNameMap: Record<string, string> = {};
      (municipalities || []).forEach((m: any) => {
        munNameMap[m.id] = m.name;
      });
      const deptNameMap = new Map<string, string>((departments || []).map((d: any) => [String(d.id), d.name]));

      for (const table of tables) {
        // Handle varying column names across tables, carefully alias them
        let selectQuery = 'id, email, status';
        if (table === 'clients' || table === 'admins' || table === 'superadmins' || table === 'workforce_admins' || table === 'workforce_officers') {
            selectQuery += ', full_name';
        }
        if (table === 'admins' || table === 'workforce_admins' || table === 'workforce_officers') {
            selectQuery += ', municipality_id';
            const hasDept = table === 'workforce_admins' || table === 'workforce_officers';
            if (hasDept) selectQuery += ', department_id';
        }

        // Every account, not just the first page (this was capped at 100 per table).
        const tbData = await fetchAllRows(() => supabase.from(table).select(selectQuery).order('id', { ascending: true }));

        if (tbData.length) {
          allUsers = [...allUsers, ...tbData.map((u: any) => {
            // Format area: convert 'cebu-city' to 'Cebu City'
            let areaDisplay = 'Global';
            if (u.municipality_id) {
              const rawName = munNameMap[u.municipality_id] || u.municipality_id;
              areaDisplay = rawName.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
            } else if (u.department_id) {
              areaDisplay = deptNameMap.get(String(u.department_id)) || 'Unassigned';
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
      return res.status(500).json({ error: serverErrorMessage(err) });
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
        return res.status(500).json({ error: serverErrorMessage(error) });
      }

      // Drop the cached withAuth status so the deactivated account can't stay usable for the TTL
      await cacheDel(authStatusKey(userReq.role, userReq.id));
      await cacheDelPrefix('users:', 'departments:');

      return res.status(200).json({ message: 'Account deleted successfully' });
    } catch (err: any) {
      return res.status(500).json({ error: serverErrorMessage(err) });
    }
  }
};
