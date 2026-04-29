import { Request, Response } from 'express';
import { supabase } from '../config/db';
import { sendWelcomeEmail, sendVerificationEmail } from '../utils/emailService';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'seebu-super-secret-key-change-me';

// All tables that hold user accounts (used when searching by email)
const USER_TABLES = [
  'clients',
  'admins',
  'superadmins',
  'workforce_admins',
  'workforce_officers',
];

/** Generate a 6-digit OTP and upsert it into verification_tokens */
async function issueVerificationToken(email: string, type: 'email_verify' | 'password_reset'): Promise<string> {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from('verification_tokens')
    .upsert(
      { email, code, type, expires_at: expiresAt },
      { onConflict: 'email,type' }
    );

  if (error) {
    console.error(`[issueVerificationToken] Failed to upsert token for ${email} (${type}):`, error);
    throw new Error('Failed to generate verification token: ' + error.message);
  }

  return code;
}

export const authController = {
  // ── Client Registration ──────────────────────────────────────────────────
  async registerClient(req: Request, res: Response) {
    try {
      const { email, password, full_name, contact_number } = req.body;

      if (!email || !password || !full_name) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const { data, error } = await supabase
        .from('clients')
        .insert([{
          email,
          password_hash: hashedPassword,
          full_name,
          contact_number,
          status: 'Active',
          email_verified: false,
        }])
        .select('*')
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      // Issue OTP and send emails
      const verificationCode = await issueVerificationToken(email, 'email_verify');

      await sendWelcomeEmail(email, full_name);
      await sendVerificationEmail(email, full_name, verificationCode);

      return res.status(201).json({
        message: 'Registration successful. Please verify your email.',
        data: {
          id: data.id,
          email: data.email,
          email_verified: false,
        },
      });
    } catch (err: any) {
      console.error('[registerClient]', err);
      return res.status(500).json({ error: err.message });
    }
  },

  // ── Google OAuth ─────────────────────────────────────────────────────────
  async googleOAuthCallback(req: Request, res: Response) {
    try {
      const { email, full_name, google_id } = req.body;

      if (!email) return res.status(400).json({ error: 'Missing OAuth email' });

      let { data: existingClient } = await supabase
        .from('clients')
        .select('*')
        .eq('email', email)
        .single();

      if (existingClient) {
        const token = jwt.sign({ id: existingClient.id, role: 'client' }, JWT_SECRET, { expiresIn: '7d' });
        return res.status(200).json({ message: 'Login successful', user: { ...existingClient, role: 'client' }, token });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(Math.random().toString(36).slice(-10), salt);

      const { data: newClient, error } = await supabase
        .from('clients')
        .insert([{
          email,
          password_hash: hashedPassword,
          full_name: full_name || 'Google User',
          status: 'Active',
          email_verified: false,
        }])
        .select('*')
        .single();

      if (error) throw error;

      const verificationCode = await issueVerificationToken(email, 'email_verify');
      await sendWelcomeEmail(email, full_name || 'Google User');
      await sendVerificationEmail(email, full_name || 'Google User', verificationCode);

      const token = jwt.sign({ id: newClient.id, role: 'client' }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(201).json({
        message: 'Registration successful via Google',
        user: { ...newClient, role: 'client' },
        token,
      });
    } catch (err: any) {
      console.error('[googleOAuthCallback]', err);
      return res.status(500).json({ error: err.message });
    }
  },

  // ── Facebook OAuth ───────────────────────────────────────────────────────
  async facebookOAuthCallback(req: Request, res: Response) {
    try {
      const { email, full_name } = req.body;
      if (!email) return res.status(400).json({ error: 'Missing OAuth email' });

      let { data: existingClient } = await supabase.from('clients').select('*').eq('email', email).single();

      if (existingClient) {
        const token = jwt.sign({ id: existingClient.id, role: 'client' }, JWT_SECRET, { expiresIn: '7d' });
        return res.status(200).json({ message: 'Login successful', user: { ...existingClient, role: 'client' }, token });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(Math.random().toString(36).slice(-10), salt);

      const { data: newClient, error } = await supabase
        .from('clients')
        .insert([{
          email,
          password_hash: hashedPassword,
          full_name: full_name || 'Facebook User',
          status: 'Active',
          email_verified: false,
        }])
        .select('*')
        .single();

      if (error) throw error;

      const verificationCode = await issueVerificationToken(email, 'email_verify');
      await sendWelcomeEmail(email, full_name || 'Facebook User');
      await sendVerificationEmail(email, full_name || 'Facebook User', verificationCode);

      const token = jwt.sign({ id: newClient.id, role: 'client' }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(201).json({
        message: 'Registration successful via Facebook',
        user: { ...newClient, role: 'client' },
        token,
      });
    } catch (err: any) {
      console.error('[facebookOAuthCallback]', err);
      return res.status(500).json({ error: err.message });
    }
  },

  // ── Login ────────────────────────────────────────────────────────────────
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
        const { data } = await supabase
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

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        // Fallback for legacy plain-text passwords during migration
        if (user.password_hash !== password) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
      }

      user.role = userRole;

      const token = jwt.sign({ id: user.id, role: userRole }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(200).json({ message: 'Login successful', token, user });
    } catch (err: any) {
      console.error('[login]', err);
      return res.status(500).json({ error: err.message });
    }
  },

  // ── Provision (Admin / Superadmin / Workforce) ───────────────────────────
  async provision(req: Request, res: Response) {
    try {
      const {
        email,
        password,
        user_role,
        municipality_id,
        first_name,
        last_name,
        full_name,
        phone,
        department,
        department_id,
        department_name,
      } = req.body;

      if (!req.user?.id || !req.user?.role) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const creatorRole = req.user.role;
      const nameToUse = full_name || `${first_name || ''} ${last_name || ''}`.trim();

      if (!email || !password || !nameToUse || !user_role) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const validRoles = ['admin', 'superadmin', 'workforce-admin', 'workforce'];
      if (!validRoles.includes(user_role)) {
        return res.status(400).json({ error: 'Invalid user_role' });
      }

      if (creatorRole === 'workforce-admin' && user_role !== 'workforce') {
        return res.status(403).json({ error: 'Workforce-admin can only provision workforce officers' });
      }

      // ── Resolve municipality ─────────────────────────────────────────────
      let resolvedMunicipalityId: string | null = municipality_id || null;

      if (creatorRole === 'admin') {
        const { data: creatorAdmin, error: creatorAdminError } = await supabase
          .from('admins')
          .select('municipality_id')
          .eq('id', req.user.id)
          .maybeSingle();

        if (creatorAdminError) throw creatorAdminError;
        resolvedMunicipalityId = creatorAdmin?.municipality_id || null;
      }

      if (creatorRole === 'workforce-admin') {
        const { data: creatorWfAdmin, error: creatorWfAdminError } = await supabase
          .from('workforce_admins')
          .select('municipality_id, department_id')
          .eq('id', req.user.id)
          .maybeSingle();

        if (creatorWfAdminError) throw creatorWfAdminError;
        resolvedMunicipalityId = creatorWfAdmin?.municipality_id || null;
      }

      if ((user_role === 'admin' || user_role === 'workforce-admin') && !resolvedMunicipalityId) {
        return res.status(400).json({ error: `${user_role} requires a municipality_id` });
      }

      // ── Resolve department ───────────────────────────────────────────────
      const departmentCandidate = department_id ?? department;
      const normalizedDepartmentName =
        department_name ||
        (typeof departmentCandidate === 'string' && !/^\d+$/.test(departmentCandidate) ? departmentCandidate : null);
      let resolvedDepartmentId: number | null = null;

      if (
        typeof departmentCandidate === 'number' ||
        (typeof departmentCandidate === 'string' && /^\d+$/.test(departmentCandidate))
      ) {
        resolvedDepartmentId = Number(departmentCandidate);
      }

      if ((user_role === 'workforce-admin' || user_role === 'workforce') && creatorRole === 'workforce-admin') {
        const { data: creatorWfAdmin, error: creatorWfAdminError } = await supabase
          .from('workforce_admins')
          .select('department_id, municipality_id')
          .eq('id', req.user.id)
          .maybeSingle();

        if (creatorWfAdminError) throw creatorWfAdminError;
        resolvedDepartmentId = creatorWfAdmin?.department_id ? Number(creatorWfAdmin.department_id) : null;
        resolvedMunicipalityId = creatorWfAdmin?.municipality_id || resolvedMunicipalityId;
      }

      if ((user_role === 'workforce-admin' || user_role === 'workforce') && !resolvedDepartmentId && normalizedDepartmentName) {
        if (!resolvedMunicipalityId) {
          return res.status(400).json({ error: 'Municipality is required to resolve department' });
        }

        const { data: existingDepartment, error: existingDepartmentError } = await supabase
          .from('departments')
          .select('id')
          .eq('municipality_id', resolvedMunicipalityId)
          .ilike('name', normalizedDepartmentName.trim())
          .maybeSingle();

        if (existingDepartmentError) throw existingDepartmentError;

        if (existingDepartment?.id) {
          resolvedDepartmentId = Number(existingDepartment.id);
        } else {
          const { data: createdDepartment, error: createdDepartmentError } = await supabase
            .from('departments')
            .insert([{ municipality_id: resolvedMunicipalityId, name: normalizedDepartmentName.trim() }])
            .select('id')
            .single();

          if (createdDepartmentError) throw createdDepartmentError;
          resolvedDepartmentId = Number(createdDepartment.id);
        }
      }

      if ((user_role === 'workforce-admin' || user_role === 'workforce') && !resolvedDepartmentId) {
        return res.status(400).json({ error: `${user_role} requires a valid department` });
      }

      if (resolvedDepartmentId && resolvedMunicipalityId) {
        const { data: departmentRecord, error: departmentRecordError } = await supabase
          .from('departments')
          .select('id, municipality_id')
          .eq('id', resolvedDepartmentId)
          .maybeSingle();

        if (departmentRecordError) throw departmentRecordError;
        if (!departmentRecord) {
          return res.status(400).json({ error: 'Department not found' });
        }
        if (departmentRecord.municipality_id !== resolvedMunicipalityId) {
          return res.status(400).json({ error: 'Department does not belong to the selected municipality' });
        }
      }

      // ── 1. Create user in Supabase Auth ─────────────────────────────────
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: nameToUse, role: user_role },
      });

      if (authError || !authData.user) {
        return res.status(500).json({ error: authError?.message || 'Failed to create auth user' });
      }

      const userId = authData.user.id;

      // ── 2. Insert into generic users table ───────────────────────────────
      const { error: usersError } = await supabase.from('users').insert([{
        id: userId,
        email,
        role: user_role,
        full_name: nameToUse,
        contact_number: phone,
        department_id: resolvedDepartmentId,
      }]);

      if (usersError) {
        console.error('[provision] Failed to insert into generic users table:', usersError);
        return res.status(500).json({ error: usersError.message });
      }

      // ── 3. Insert into role-specific table with HASHED password ──────────
      let table = '';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const insertData: any = {
        id: userId,
        email,
        password_hash: hashedPassword,   // FIX: was storing plaintext
        full_name: nameToUse,
        contact_number: phone,
        status: 'Active',
        email_verified: false,
      };

      if (user_role === 'admin') {
        table = 'admins';
        insertData.municipality_id = resolvedMunicipalityId;
      } else if (user_role === 'superadmin') {
        table = 'superadmins';
      } else if (user_role === 'workforce-admin') {
        table = 'workforce_admins';
        insertData.department_id = resolvedDepartmentId;
        insertData.municipality_id = resolvedMunicipalityId;
      } else if (user_role === 'workforce') {
        table = 'workforce_officers';
        insertData.employee_id = `EMP-${Math.floor(Math.random() * 10000)}`;
        insertData.department_id = resolvedDepartmentId;
        insertData.municipality_id = resolvedMunicipalityId;
        insertData.role = 'officer';
      }

      if (table) {
        const { error: roleError } = await supabase.from(table).insert([insertData]);
        if (roleError) {
          console.error(`[provision] Failed to insert into ${table}:`, roleError);
        }
      }

      // ── 4. Issue OTP and send verification email ─────────────────────────
      try {
        const verificationCode = await issueVerificationToken(email, 'email_verify');
        await sendVerificationEmail(email, nameToUse, verificationCode);
      } catch (emailErr) {
        // Non-fatal: user is created, just log and continue
        console.error('[provision] Failed to send verification email:', emailErr);
      }

      return res.status(201).json({
        message: 'Provisioning successful. A verification email has been sent.',
        user_id: userId,
        role: user_role,
      });
    } catch (err: any) {
      console.error('[provision]', err);
      return res.status(500).json({ error: err.message });
    }
  },

  // ── Forgot Password ──────────────────────────────────────────────────────
  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Missing email' });
      }

      let user = null;

      for (const table of USER_TABLES) {
        const { data } = await supabase
          .from(table)
          .select('id, email, full_name')
          .eq('email', email)
          .single();

        if (data) {
          user = data;
          break;
        }
      }

      if (!user) {
        return res.status(200).json({ found: false, message: 'Account not found.' });
      }

      const otp = await issueVerificationToken(user.email, 'password_reset');

      // Fire-and-forget — don't block response on email delivery
      sendVerificationEmail(user.email, user.full_name || 'SeeBu User', otp).catch((err) =>
        console.error('[forgotPassword] Email send failed:', err)
      );

      return res.status(200).json({
        found: true,
        message: 'A 6-digit verification code has been sent to your email.',
      });
    } catch (err: any) {
      console.error('[forgotPassword]', err);
      return res.status(500).json({ error: err.message });
    }
  },

  // ── Verify Reset Code (Step 2 of forgot-password) ────────────────────────
  async verifyResetCode(req: Request, res: Response) {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return res.status(400).json({ error: 'Missing email or code' });
      }

      const { data: token, error: tokenError } = await supabase
        .from('verification_tokens')
        .select('*')
        .eq('email', email)
        .eq('code', code)
        .eq('type', 'password_reset')
        .gte('expires_at', new Date().toISOString())
        .single();

      if (tokenError || !token) {
        return res.status(400).json({ error: 'Invalid or expired verification code' });
      }

      return res.status(200).json({ valid: true, message: 'Code is valid. You may now reset your password.' });
    } catch (err: any) {
      console.error('[verifyResetCode]', err);
      return res.status(500).json({ error: err.message });
    }
  },

  // ── Reset Password (Step 3 of forgot-password) ───────────────────────────
  async resetPassword(req: Request, res: Response) {
    try {
      const { email, code, new_password } = req.body;

      if (!email || !code || !new_password) {
        return res.status(400).json({ error: 'Missing email, code, or new_password' });
      }

      if (new_password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }

      // Re-validate the token before changing anything
      const { data: token, error: tokenError } = await supabase
        .from('verification_tokens')
        .select('*')
        .eq('email', email)
        .eq('code', code)
        .eq('type', 'password_reset')
        .gte('expires_at', new Date().toISOString())
        .single();

      if (tokenError || !token) {
        return res.status(400).json({ error: 'Invalid or expired verification code' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(new_password, salt);

      // Update password across all user tables (only one will match)
      for (const table of USER_TABLES) {
        const { error: updateError } = await supabase
          .from(table)
          .update({ password_hash: hashedPassword })
          .eq('email', email);

        if (updateError) {
          console.error(`[resetPassword] Failed to update ${table}:`, updateError);
        }
      }

      // Delete the used token
      await supabase
        .from('verification_tokens')
        .delete()
        .eq('email', email)
        .eq('type', 'password_reset');

      return res.status(200).json({ message: 'Password reset successfully. You can now log in.' });
    } catch (err: any) {
      console.error('[resetPassword]', err);
      return res.status(500).json({ error: err.message });
    }
  },

  // ── Verify Email ─────────────────────────────────────────────────────────
  async verifyEmail(req: Request, res: Response) {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return res.status(400).json({ error: 'Missing email or verification code' });
      }

      if (code.length !== 6) {
        return res.status(400).json({ error: 'Invalid verification code' });
      }

      const { data: token, error: tokenError } = await supabase
        .from('verification_tokens')
        .select('*')
        .eq('email', email)
        .eq('code', code)
        .eq('type', 'email_verify')
        .gte('expires_at', new Date().toISOString())
        .single();

      if (tokenError || !token) {
        return res.status(400).json({ error: 'Invalid or expired verification code' });
      }

      // Mark email as verified across all user tables (only one will match)
      for (const table of USER_TABLES) {
        await supabase
          .from(table)
          .update({ email_verified: true })
          .eq('email', email);
      }

      // Delete the used token
      await supabase
        .from('verification_tokens')
        .delete()
        .eq('email', email)
        .eq('type', 'email_verify');

      return res.status(200).json({ message: 'Email verified successfully', email_verified: true });
    } catch (err: any) {
      console.error('[verifyEmail]', err);
      return res.status(500).json({ error: err.message });
    }
  },

  // ── Resend Verification ───────────────────────────────────────────────────
  async resendVerification(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Missing email' });
      }

      // Find the user across all tables
      let user: { email: string; full_name?: string } | null = null;

      for (const table of USER_TABLES) {
        const { data } = await supabase
          .from(table)
          .select('id, email, full_name')
          .eq('email', email)
          .single();

        if (data) {
          user = data;
          break;
        }
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const verificationCode = await issueVerificationToken(email, 'email_verify');
      await sendVerificationEmail(email, user.full_name || 'SeeBu User', verificationCode);

      return res.status(200).json({ message: 'Verification code sent to your email' });
    } catch (err: any) {
      console.error('[resendVerification]', err);
      return res.status(500).json({ error: err.message });
    }
  },
};
