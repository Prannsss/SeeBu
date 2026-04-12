import { Request, Response } from 'express';
import { supabase } from '../config/db';
import { sendWelcomeEmail } from '../utils/emailService';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'seebu-super-secret-key-change-me';

export const authController = {
  // Existing local register
  async registerClient(req: Request, res: Response) {
    try {
      const { email, password, full_name, contact_number } = req.body;

      if (!email || !password || !full_name) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Hash password using bcrypt
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const { data, error } = await supabase
        .from('clients')
        .insert([
          { email, password_hash: hashedPassword, full_name, contact_number, status: 'Active' }
        ])
        .select('*')
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      // Send Welcome message
      await sendWelcomeEmail(email, full_name);

      return res.status(201).json({ message: 'Registration successful', data });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  // OAuth Google Callback (Simulated / Simplified for custom table config)
  async googleOAuthCallback(req: Request, res: Response) {
    try {
      // In a real scenario, you'd exchange code for tokens via google-auth-library
      // For this implementation, we assume frontend sends the verified Google email/name
      const { email, full_name, google_id } = req.body; 

      if (!email) return res.status(400).json({ error: "Missing OAuth email" });

      // Check if user already exists across tables, or strictly clients
      let { data: existingClient } = await supabase
        .from('clients')
        .select('*')
        .eq('email', email)
        .single();

      if (existingClient) {
        // They exist, log them in
        const token = jwt.sign({ id: existingClient.id, role: 'client' }, JWT_SECRET, { expiresIn: '7d' });
        return res.status(200).json({ message: "Login successful", user: { ...existingClient, role: 'client' }, token });
      }

      // If they don't exist, we MUST register them STRICTLY as a client
      // Generate a random password hash since they use OAuth
      const salt = await bcrypt.genSalt(10);
      const randomPassword = Math.random().toString(36).slice(-10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      const { data: newClient, error } = await supabase
        .from('clients')
        .insert([
          { 
            email, 
            password_hash: hashedPassword, 
            full_name: full_name || "Google User",
            status: 'Active' 
          }
        ])
        .select('*')
        .single();

      if (error) throw error;

      // Welcome and verification triggers
      await sendWelcomeEmail(email, full_name || "Google User");

      const token = jwt.sign({ id: newClient.id, role: 'client' }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(201).json({ 
        message: "Registration successful via Google", 
        user: { ...newClient, role: 'client' }, 
        token 
      });

    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },
  
  // Facebook Callback 
  async facebookOAuthCallback(req: Request, res: Response) {
    // Same logic as Google essentially, strictly clients table
    try {
      const { email, full_name } = req.body; 
      if (!email) return res.status(400).json({ error: "Missing OAuth email" });

      let { data: existingClient } = await supabase.from('clients').select('*').eq('email', email).single();

      if (existingClient) {
        const token = jwt.sign({ id: existingClient.id, role: 'client' }, JWT_SECRET, { expiresIn: '7d' });
        return res.status(200).json({ message: "Login successful", user: { ...existingClient, role: 'client' }, token });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(Math.random().toString(36).slice(-10), salt);

      const { data: newClient, error } = await supabase
        .from('clients')
        .insert([{ email, password_hash: hashedPassword, full_name: full_name || "Facebook User", status: 'Active' }])
        .select('*')
        .single();

      if (error) throw error;
      await sendWelcomeEmail(email, full_name || "Facebook User");

      const token = jwt.sign({ id: newClient.id, role: 'client' }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(201).json({ message: "Registration successful via Facebook", user: { ...newClient, role: 'client' }, token });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Missing email or password' });
      }

      const tables = [
        { name: 'clients', role: 'client' },
        { name: 'admins', role: 'admin' },
        { name: 'superadmins', role: 'superadmin' },
        { name: 'workforce_admins', role: 'workforce-admin' },
        { name: 'workforce_officers', role: 'workforce' },
      ];

      let user = null;
      let userRole = null;

      for (const table of tables) {
        const { data, error } = await supabase
          .from(table.name)
          .select('*')
          .eq('email', email)
          .single();

        if (data) {
          user = data;
          userRole = table.role;
          break;
        }
      }

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Check password using bcrypt
      const isMatch = await bcrypt.compare(password, user.password_hash);
      
      if (!isMatch) {
        // Fallback for plain text passwords in testing/legacy data if needed
        if (user.password_hash !== password) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
      }

      user.role = userRole;

      const token = jwt.sign({ id: user.id, role: userRole }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(200).json({ message: 'Login successful', token, user: user });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  async provision(req: Request, res: Response) {
    try {
      const { 
        email, 
        password, 
        user_role, 
        municipality_id,
        first_name,
        last_name,
        full_name, // legacy compat
        phone,
        department
      } = req.body;

      const nameToUse = full_name || `${first_name || ''} ${last_name || ''}`.trim(); 

      if (!email || !password || !nameToUse || !user_role) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (user_role === 'admin' && !municipality_id) {
        return res.status(400).json({ error: 'Admin requires a municipality_id' });     
      }

      const validRoles = ['admin', 'superadmin', 'workforce'];
      if (!validRoles.includes(user_role)) {
        return res.status(400).json({ error: 'Invalid user_role' });
      }

      // 1. Create User in Supabase Auth via Admin API
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: nameToUse,
          role: user_role,
        }
      });

      if (authError || !authData.user) {
        return res.status(500).json({ error: authError?.message || 'Failed to create auth user' });
      }

      const userId = authData.user.id;

      // 2. Insert into the generic "users" table
      const { error: usersError } = await supabase
        .from('users')
        .insert([{
          id: userId,
          email,
          role: user_role,
          full_name: nameToUse,
          contact_number: phone,
          department_id: department || null,
        }]);

      if (usersError) {
        // Warning: Might need to cleanup the auth user if this fails, but for now we proceed or return error
        console.error('Failed to insert into generic users table:', usersError);
        return res.status(500).json({ error: usersError.message });
      }

      // 3. (Optional) Insert into role-specific table if it exists
      // e.g. admins, superadmins, workforce_officers
      let table = '';
      const insertData: any = {
        id: userId,
        email,
        password_hash: password, // Still syncing for legacy login if needed
        full_name: nameToUse,
        contact_number: phone,
        status: 'Active'
      };

      if (user_role === 'admin') {
        table = 'admins';
        insertData.municipality_id = municipality_id;
      } else if (user_role === 'superadmin') {
        table = 'superadmins';
      } else if (user_role === 'workforce') {
        table = 'workforce_officers';
        insertData.employee_id = `EMP-${Math.floor(Math.random() * 10000)}`;
        insertData.department_id = department;
        insertData.role = 'officer';
      }

      if (table) {
        const { error: roleError } = await supabase
          .from(table)
          .insert([insertData]);

        if (roleError) {
          console.error(`Failed to insert into ${table}:`, roleError);
          // Return non-fatal error but 201 since auth user & generic users table created
        }
      }

      return res.status(201).json({ 
        message: 'Provisioning successful', 
        user_id: userId, 
        role: user_role 
      });        
    } catch (err: any) {
      console.error('Provisioning error:', err);
      return res.status(500).json({ error: err.message });
    }
  }
};
