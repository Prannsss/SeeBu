import { Request, Response } from 'express';
import { supabase } from '../config/db';
import { serverErrorMessage } from '../utils/errorResponse';
import { sendWelcomeEmail, sendVerificationEmail, sendPasswordResetEmail, sendPasswordChangedEmail } from '../utils/emailService';
import { HOME_PATH, ROLE_LABEL, passwordProblems } from '../utils/staffInvites';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { findAccountsByEmail, emailExists } from '../utils/accounts';
import { authStatusKey, cacheDel, cacheDelPrefix } from '../utils/cache';

const JWT_SECRET = process.env.JWT_SECRET as string;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID as string;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET as string;

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

/** Verify a Google Sign-In ID token server-side and return the verified profile */
async function verifyGoogleIdToken(idToken: string) {
  const ticket = await googleClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
  const payload = ticket.getPayload();
  if (!payload || !payload.email || !payload.email_verified) {
    throw new Error('Google account email is not verified');
  }
  return { email: payload.email, full_name: payload.name || 'Google User', google_id: payload.sub };
}

/** Verify a Facebook access token server-side (debug_token) and fetch the verified profile */
async function verifyFacebookAccessToken(accessToken: string) {
  const appAccessToken = `${FACEBOOK_APP_ID}|${FACEBOOK_APP_SECRET}`;
  const debugUrl = `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(appAccessToken)}`;
  const debugRes = await fetch(debugUrl);
  const debugData: any = await debugRes.json();

  if (!debugRes.ok || !debugData?.data?.is_valid || debugData.data.app_id !== FACEBOOK_APP_ID) {
    throw new Error('Invalid Facebook access token');
  }

  const profileUrl = `https://graph.facebook.com/me?fields=id,name,email&access_token=${encodeURIComponent(accessToken)}`;
  const profileRes = await fetch(profileUrl);
  const profile: any = await profileRes.json();

  if (!profileRes.ok || !profile?.email) {
    throw new Error('Unable to retrieve verified Facebook profile email');
  }

  return { email: profile.email, full_name: profile.name || 'Facebook User', facebook_id: profile.id };
}

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
  const code = crypto.randomInt(100000, 1000000).toString();
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

      if (await emailExists(email)) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
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
        return res.status(500).json({ error: serverErrorMessage(error) });
      }
      await cacheDelPrefix('users:');

      // The account already exists past this point, so email failures must not 500 —
      // otherwise the retry hits 409. The user can use /resend-verification instead.
      let emailSent = false;
      try {
        const verificationCode = await issueVerificationToken(email, 'email_verify');
        await sendVerificationEmail(email, full_name, verificationCode);
        emailSent = true;
      } catch (mailErr) {
        console.error('[registerClient] verification email failed:', mailErr);
      }
      sendWelcomeEmail(email, full_name).catch((e) => console.error('[registerClient] welcome email failed:', e));

      return res.status(201).json({
        message: 'Registration successful. Please verify your email.',
        data: {
          id: data.id,
          email: data.email,
          email_verified: false,
          email_sent: emailSent,
        },
      });
    } catch (err: any) {
      console.error('[registerClient]', err);
      return res.status(500).json({ error: serverErrorMessage(err) });
    }
  },

  // ── Google OAuth ─────────────────────────────────────────────────────────
  async googleOAuthCallback(req: Request, res: Response) {
    try {
      const { credential, action } = req.body;
      if (!credential) return res.status(400).json({ error: 'Missing Google credential' });

      let verified;
      try {
        verified = await verifyGoogleIdToken(credential);
      } catch (verifyErr: any) {
        return res.status(401).json({ error: 'Invalid Google credential' });
      }
      const { email, full_name } = verified;

      let { data: existingClient } = await supabase
        .from('clients')
        .select('*')
        .eq('email', email)
        .single();

      if (action === 'login') {
        if (!existingClient) {
          return res.status(401).json({ error: "Invalid. This account doesn't have an account. Sign up first" });
        }
        const token = jwt.sign({ id: existingClient.id, role: 'client' }, JWT_SECRET, { expiresIn: '7d' });
        const { password_hash, ...safeUser } = existingClient;
        return res.status(200).json({ message: 'Login successful', user: { ...safeUser, role: 'client' }, token });
      }

      // If action is register (or fallback)
      if (existingClient) {
        const token = jwt.sign({ id: existingClient.id, role: 'client' }, JWT_SECRET, { expiresIn: '7d' });
        const { password_hash, ...safeUser } = existingClient;
        return res.status(200).json({ message: 'Login successful', user: { ...safeUser, role: 'client' }, token });
      }

      if (await emailExists(email)) {
        return res.status(409).json({ error: 'This email belongs to an existing staff account. Please sign in with your email and password.' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), salt);

      const { data: newClient, error } = await supabase
        .from('clients')
        .insert([{
          email,
          password_hash: hashedPassword,
          full_name,
          status: 'Active',
          email_verified: true, // verified by default for OAuth
        }])
        .select('*')
        .single();

      if (error) throw error;
      await cacheDelPrefix('users:');

      // OAuth emails are already verified by the provider — welcome only, no OTP.
      sendWelcomeEmail(email, full_name || 'Google User').catch((e) => console.error('[googleOAuth] welcome email failed:', e));

      const token = jwt.sign({ id: newClient.id, role: 'client' }, JWT_SECRET, { expiresIn: '7d' });
      const { password_hash, ...safeNewUser } = newClient;
      return res.status(201).json({
        message: 'Registration successful via Google',
        user: { ...safeNewUser, role: 'client' },
        token,
      });
    } catch (err: any) {
      console.error('[googleOAuthCallback]', err);
      return res.status(500).json({ error: serverErrorMessage(err) });
    }
  },

  // ── Facebook OAuth ───────────────────────────────────────────────────────
  async facebookOAuthCallback(req: Request, res: Response) {
    try {
      const { accessToken, action } = req.body;
      if (!accessToken) return res.status(400).json({ error: 'Missing Facebook access token' });

      let verified;
      try {
        verified = await verifyFacebookAccessToken(accessToken);
      } catch (verifyErr: any) {
        return res.status(401).json({ error: 'Invalid Facebook access token' });
      }
      const { email, full_name } = verified;

      let { data: existingClient } = await supabase.from('clients').select('*').eq('email', email).single();

      if (action === 'login') {
        if (!existingClient) {
          return res.status(401).json({ error: "Invalid. This account doesn't have an account. Sign up first" });
        }
        const token = jwt.sign({ id: existingClient.id, role: 'client' }, JWT_SECRET, { expiresIn: '7d' });
        const { password_hash, ...safeUser } = existingClient;
        return res.status(200).json({ message: 'Login successful', user: { ...safeUser, role: 'client' }, token });
      }

      if (existingClient) {
        const token = jwt.sign({ id: existingClient.id, role: 'client' }, JWT_SECRET, { expiresIn: '7d' });
        const { password_hash, ...safeUser } = existingClient;
        return res.status(200).json({ message: 'Login successful', user: { ...safeUser, role: 'client' }, token });
      }

      if (await emailExists(email)) {
        return res.status(409).json({ error: 'This email belongs to an existing staff account. Please sign in with your email and password.' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), salt);

      const { data: newClient, error } = await supabase
        .from('clients')
        .insert([{
          email,
          password_hash: hashedPassword,
          full_name,
          status: 'Active',
          email_verified: true, // verified by default for OAuth
        }])
        .select('*')
        .single();

      if (error) throw error;
      await cacheDelPrefix('users:');

      // OAuth emails are already verified by the provider — welcome only, no OTP.
      sendWelcomeEmail(email, full_name || 'Facebook User').catch((e) => console.error('[facebookOAuth] welcome email failed:', e));

      const token = jwt.sign({ id: newClient.id, role: 'client' }, JWT_SECRET, { expiresIn: '7d' });
      const { password_hash, ...safeNewUser } = newClient;
      return res.status(201).json({
        message: 'Registration successful via Facebook',
        user: { ...safeNewUser, role: 'client' },
        token,
      });
    } catch (err: any) {
      console.error('[facebookOAuthCallback]', err);
      return res.status(500).json({ error: serverErrorMessage(err) });
    }
  },

  // ── Login ────────────────────────────────────────────────────────────────
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Missing email or password' });
      }

      // The frontend sends role:'user', so a role param can't be required. Instead: staff tables are
      // checked before clients and the account is chosen by password match, so a client account
      // registered with a staff email can never shadow or take over the staff account.
      const candidates = await findAccountsByEmail(email);

      let user: any = null;
      let userRole: string | null = null;

      for (const candidate of candidates) {
        if (candidate.row.password_hash && await bcrypt.compare(password, candidate.row.password_hash)) {
          user = candidate.row;
          userRole = candidate.role;
          break;
        }
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      if (user.status === 'Invited') {
        return res.status(403).json({
          error: 'Please accept your invitation first: open the invitation email we sent you and choose "View invitation".',
        });
      }
      // 'Pending Setup' = accepted an invitation; may sign in, but only to choose a new password.
      if (user.status && user.status !== 'Active' && user.status !== 'Pending Setup') {
        return res.status(403).json({ error: 'Your account is not active. Please contact your administrator.' });
      }

      const { password_hash, ...safeUser } = user;
      safeUser.role = userRole;
      safeUser.must_change_password = user.status === 'Pending Setup';

      const token = jwt.sign({ id: user.id, role: userRole }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(200).json({ message: 'Login successful', token, user: safeUser });
    } catch (err: any) {
      console.error('[login]', err);
      return res.status(500).json({ error: serverErrorMessage(err) });
    }
  },

  // ── Change Password (invited staff, once, right after their first sign-in) ──
  async changePassword(req: Request, res: Response) {
    try {
      const { new_password } = req.body;
      const problems = passwordProblems(new_password);
      if (problems.length) {
        return res.status(400).json({ error: `Your password needs ${problems.join(', ')}.` });
      }

      const role: string = req.user.role;
      const table = ({ admin: 'admins', superadmin: 'superadmins', 'workforce-admin': 'workforce_admins', workforce: 'workforce_officers', client: 'clients' } as Record<string, string>)[role];
      const { data: account, error: lookupError } = await supabase
        .from(table)
        .select('id, email, full_name, status, password_hash')
        .eq('id', req.user.id)
        .maybeSingle();
      if (lookupError) throw lookupError;
      if (!account) return res.status(404).json({ error: 'Account not found.' });
      if (account.status !== 'Pending Setup') {
        return res.status(409).json({ error: 'Your password is already set. Use "Forgot password?" on the login page to change it.' });
      }
      if (await bcrypt.compare(new_password, account.password_hash)) {
        return res.status(400).json({ error: 'Please choose a password different from your temporary password.' });
      }

      const { data: updated, error: updateError } = await supabase
        .from(table)
        .update({ password_hash: await bcrypt.hash(new_password, 10), status: 'Active' })
        .eq('id', account.id)
        .eq('status', 'Pending Setup')
        .select('id');
      if (updateError) throw updateError;
      if (!updated?.length) return res.status(409).json({ error: 'Your password is already set.' });

      await cacheDel(authStatusKey(role, account.id));
      await cacheDelPrefix('users:', 'departments:');

      sendPasswordChangedEmail(account.email, {
        name: account.full_name || 'there',
        roleLabel: ROLE_LABEL[role] || 'SeeBu',
        dashboardUrl: `${process.env.FRONTEND_URL || 'https://seebu.prannsss.dev'}${HOME_PATH[role] || ''}`,
        changedAt: new Date(),
      }).catch((e) => console.error('[changePassword] confirmation email failed:', e));

      return res.status(200).json({ message: 'Password updated.', data: { role, home: HOME_PATH[role] || '/' } });
    } catch (err: any) {
      console.error('[changePassword]', err);
      return res.status(500).json({ error: serverErrorMessage(err) });
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

      if (await emailExists(email)) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
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

      // ── 2. Insert into generic users table (optional: the table may not exist) ──
      const { error: usersError } = await supabase.from('users').insert([{
        id: userId,
        email,
        role: user_role,
        full_name: nameToUse,
        contact_number: phone,
        department_id: resolvedDepartmentId,
      }]);

      if (usersError) {
        console.warn('[provision] optional users table insert skipped:', usersError.message);
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
          // Fatal: without the role-table row the account can never log in
          console.error(`[provision] Failed to insert into ${table}:`, roleError);
          return res.status(500).json({ error: serverErrorMessage(roleError) });
        }
      }
      await cacheDelPrefix('users:', 'departments:');

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
      return res.status(500).json({ error: serverErrorMessage(err) });
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
        const { data } = await supabase.from(table).select('id, email, full_name').eq('email', email).single();

        if (data) {
          user = data;
          break;
        }
      }

      const genericMessage = 'If an account with that email exists, a verification code has been sent.';

      if (!user) {
        return res.status(200).json({ message: genericMessage });
      }

      const otp = await issueVerificationToken(user.email, 'password_reset');

      // Fire-and-forget — don't block response on email delivery
      sendPasswordResetEmail(user.email, user.full_name || 'SeeBu User', otp).catch((err) =>
        console.error('[forgotPassword] Email send failed:', err)
      );

      return res.status(200).json({ message: genericMessage });
    } catch (err: any) {
      console.error('[forgotPassword]', err);
      return res.status(500).json({ error: serverErrorMessage(err) });
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
      return res.status(500).json({ error: serverErrorMessage(err) });
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
      return res.status(500).json({ error: serverErrorMessage(err) });
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
      return res.status(500).json({ error: serverErrorMessage(err) });
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
      try {
        await sendVerificationEmail(email, user.full_name || 'SeeBu User', verificationCode);
      } catch (mailErr) {
        console.error('[resendVerification] email send failed:', mailErr);
        return res.status(502).json({ error: "We couldn't send the verification email right now. Please try again in a few minutes." });
      }

      return res.status(200).json({ message: 'Verification code sent to your email' });
    } catch (err: any) {
      console.error('[resendVerification]', err);
      return res.status(500).json({ error: serverErrorMessage(err) });
    }
  },
};
