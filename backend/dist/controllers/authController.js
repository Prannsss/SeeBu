"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const db_1 = require("../config/db");
const errorResponse_1 = require("../utils/errorResponse");
const emailService_1 = require("../utils/emailService");
const smsService_1 = require("../utils/smsService");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const google_auth_library_1 = require("google-auth-library");
const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const googleClient = new google_auth_library_1.OAuth2Client(GOOGLE_CLIENT_ID);
/** Verify a Google Sign-In ID token server-side and return the verified profile */
async function verifyGoogleIdToken(idToken) {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.email_verified) {
        throw new Error('Google account email is not verified');
    }
    return { email: payload.email, full_name: payload.name || 'Google User', google_id: payload.sub };
}
/** Verify a Facebook access token server-side (debug_token) and fetch the verified profile */
async function verifyFacebookAccessToken(accessToken) {
    const appAccessToken = `${FACEBOOK_APP_ID}|${FACEBOOK_APP_SECRET}`;
    const debugUrl = `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(appAccessToken)}`;
    const debugRes = await fetch(debugUrl);
    const debugData = await debugRes.json();
    if (!debugRes.ok || !debugData?.data?.is_valid || debugData.data.app_id !== FACEBOOK_APP_ID) {
        throw new Error('Invalid Facebook access token');
    }
    const profileUrl = `https://graph.facebook.com/me?fields=id,name,email&access_token=${encodeURIComponent(accessToken)}`;
    const profileRes = await fetch(profileUrl);
    const profile = await profileRes.json();
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
async function issueVerificationToken(email, type) {
    const code = crypto_1.default.randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const { error } = await db_1.supabase
        .from('verification_tokens')
        .upsert({ email, code, type, expires_at: expiresAt }, { onConflict: 'email,type' });
    if (error) {
        console.error(`[issueVerificationToken] Failed to upsert token for ${email} (${type}):`, error);
        throw new Error('Failed to generate verification token: ' + error.message);
    }
    return code;
}
exports.authController = {
    // ── Client Registration ──────────────────────────────────────────────────
    async registerClient(req, res) {
        try {
            const { email, password, full_name, contact_number } = req.body;
            if (!email || !password || !full_name) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            const salt = await bcryptjs_1.default.genSalt(10);
            const hashedPassword = await bcryptjs_1.default.hash(password, salt);
            const { data, error } = await db_1.supabase
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
                return res.status(500).json({ error: (0, errorResponse_1.serverErrorMessage)(error) });
            }
            // Issue OTP and send emails
            const verificationCode = await issueVerificationToken(email, 'email_verify');
            await (0, emailService_1.sendWelcomeEmail)(email, full_name);
            await (0, emailService_1.sendVerificationEmail)(email, full_name, verificationCode);
            return res.status(201).json({
                message: 'Registration successful. Please verify your email.',
                data: {
                    id: data.id,
                    email: data.email,
                    email_verified: false,
                },
            });
        }
        catch (err) {
            console.error('[registerClient]', err);
            return res.status(500).json({ error: (0, errorResponse_1.serverErrorMessage)(err) });
        }
    },
    // ── Google OAuth ─────────────────────────────────────────────────────────
    async googleOAuthCallback(req, res) {
        try {
            const { credential, action } = req.body;
            if (!credential)
                return res.status(400).json({ error: 'Missing Google credential' });
            let verified;
            try {
                verified = await verifyGoogleIdToken(credential);
            }
            catch (verifyErr) {
                return res.status(401).json({ error: 'Invalid Google credential' });
            }
            const { email, full_name } = verified;
            let { data: existingClient } = await db_1.supabase
                .from('clients')
                .select('*')
                .eq('email', email)
                .single();
            if (action === 'login') {
                if (!existingClient) {
                    return res.status(401).json({ error: "Invalid. This account doesn't have an account. Sign up first" });
                }
                const token = jsonwebtoken_1.default.sign({ id: existingClient.id, role: 'client' }, JWT_SECRET, { expiresIn: '7d' });
                const { password_hash, ...safeUser } = existingClient;
                return res.status(200).json({ message: 'Login successful', user: { ...safeUser, role: 'client' }, token });
            }
            // If action is register (or fallback)
            if (existingClient) {
                const token = jsonwebtoken_1.default.sign({ id: existingClient.id, role: 'client' }, JWT_SECRET, { expiresIn: '7d' });
                const { password_hash, ...safeUser } = existingClient;
                return res.status(200).json({ message: 'Login successful', user: { ...safeUser, role: 'client' }, token });
            }
            const salt = await bcryptjs_1.default.genSalt(10);
            const hashedPassword = await bcryptjs_1.default.hash(crypto_1.default.randomBytes(16).toString('hex'), salt);
            const { data: newClient, error } = await db_1.supabase
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
            if (error)
                throw error;
            // Do NOT trigger the email service for OAuth registrations
            // const verificationCode = await issueVerificationToken(email, 'email_verify');
            // await sendWelcomeEmail(email, full_name || 'Google User');
            // await sendVerificationEmail(email, full_name || 'Google User', verificationCode);
            const token = jsonwebtoken_1.default.sign({ id: newClient.id, role: 'client' }, JWT_SECRET, { expiresIn: '7d' });
            const { password_hash, ...safeNewUser } = newClient;
            return res.status(201).json({
                message: 'Registration successful via Google',
                user: { ...safeNewUser, role: 'client' },
                token,
            });
        }
        catch (err) {
            console.error('[googleOAuthCallback]', err);
            return res.status(500).json({ error: (0, errorResponse_1.serverErrorMessage)(err) });
        }
    },
    // ── Facebook OAuth ───────────────────────────────────────────────────────
    async facebookOAuthCallback(req, res) {
        try {
            const { accessToken, action } = req.body;
            if (!accessToken)
                return res.status(400).json({ error: 'Missing Facebook access token' });
            let verified;
            try {
                verified = await verifyFacebookAccessToken(accessToken);
            }
            catch (verifyErr) {
                return res.status(401).json({ error: 'Invalid Facebook access token' });
            }
            const { email, full_name } = verified;
            let { data: existingClient } = await db_1.supabase.from('clients').select('*').eq('email', email).single();
            if (action === 'login') {
                if (!existingClient) {
                    return res.status(401).json({ error: "Invalid. This account doesn't have an account. Sign up first" });
                }
                const token = jsonwebtoken_1.default.sign({ id: existingClient.id, role: 'client' }, JWT_SECRET, { expiresIn: '7d' });
                const { password_hash, ...safeUser } = existingClient;
                return res.status(200).json({ message: 'Login successful', user: { ...safeUser, role: 'client' }, token });
            }
            if (existingClient) {
                const token = jsonwebtoken_1.default.sign({ id: existingClient.id, role: 'client' }, JWT_SECRET, { expiresIn: '7d' });
                const { password_hash, ...safeUser } = existingClient;
                return res.status(200).json({ message: 'Login successful', user: { ...safeUser, role: 'client' }, token });
            }
            const salt = await bcryptjs_1.default.genSalt(10);
            const hashedPassword = await bcryptjs_1.default.hash(crypto_1.default.randomBytes(16).toString('hex'), salt);
            const { data: newClient, error } = await db_1.supabase
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
            if (error)
                throw error;
            // Do NOT trigger the email service for OAuth registrations
            // const verificationCode = await issueVerificationToken(email, 'email_verify');
            // await sendWelcomeEmail(email, full_name || 'Facebook User');
            // await sendVerificationEmail(email, full_name || 'Facebook User', verificationCode);
            const token = jsonwebtoken_1.default.sign({ id: newClient.id, role: 'client' }, JWT_SECRET, { expiresIn: '7d' });
            const { password_hash, ...safeNewUser } = newClient;
            return res.status(201).json({
                message: 'Registration successful via Facebook',
                user: { ...safeNewUser, role: 'client' },
                token,
            });
        }
        catch (err) {
            console.error('[facebookOAuthCallback]', err);
            return res.status(500).json({ error: (0, errorResponse_1.serverErrorMessage)(err) });
        }
    },
    // ── Login ────────────────────────────────────────────────────────────────
    async login(req, res) {
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
                const { data } = await db_1.supabase
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
            const isMatch = await bcryptjs_1.default.compare(password, user.password_hash);
            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            const { password_hash, ...safeUser } = user;
            safeUser.role = userRole;
            const token = jsonwebtoken_1.default.sign({ id: user.id, role: userRole }, JWT_SECRET, { expiresIn: '7d' });
            return res.status(200).json({ message: 'Login successful', token, user: safeUser });
        }
        catch (err) {
            console.error('[login]', err);
            return res.status(500).json({ error: (0, errorResponse_1.serverErrorMessage)(err) });
        }
    },
    // ── Provision (Admin / Superadmin / Workforce) ───────────────────────────
    async provision(req, res) {
        try {
            const { email, password, user_role, municipality_id, first_name, last_name, full_name, phone, department, department_id, department_name, } = req.body;
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
            let resolvedMunicipalityId = municipality_id || null;
            if (creatorRole === 'admin') {
                const { data: creatorAdmin, error: creatorAdminError } = await db_1.supabase
                    .from('admins')
                    .select('municipality_id')
                    .eq('id', req.user.id)
                    .maybeSingle();
                if (creatorAdminError)
                    throw creatorAdminError;
                resolvedMunicipalityId = creatorAdmin?.municipality_id || null;
            }
            if (creatorRole === 'workforce-admin') {
                const { data: creatorWfAdmin, error: creatorWfAdminError } = await db_1.supabase
                    .from('workforce_admins')
                    .select('municipality_id, department_id')
                    .eq('id', req.user.id)
                    .maybeSingle();
                if (creatorWfAdminError)
                    throw creatorWfAdminError;
                resolvedMunicipalityId = creatorWfAdmin?.municipality_id || null;
            }
            if ((user_role === 'admin' || user_role === 'workforce-admin') && !resolvedMunicipalityId) {
                return res.status(400).json({ error: `${user_role} requires a municipality_id` });
            }
            // ── Resolve department ───────────────────────────────────────────────
            const departmentCandidate = department_id ?? department;
            const normalizedDepartmentName = department_name ||
                (typeof departmentCandidate === 'string' && !/^\d+$/.test(departmentCandidate) ? departmentCandidate : null);
            let resolvedDepartmentId = null;
            if (typeof departmentCandidate === 'number' ||
                (typeof departmentCandidate === 'string' && /^\d+$/.test(departmentCandidate))) {
                resolvedDepartmentId = Number(departmentCandidate);
            }
            if ((user_role === 'workforce-admin' || user_role === 'workforce') && creatorRole === 'workforce-admin') {
                const { data: creatorWfAdmin, error: creatorWfAdminError } = await db_1.supabase
                    .from('workforce_admins')
                    .select('department_id, municipality_id')
                    .eq('id', req.user.id)
                    .maybeSingle();
                if (creatorWfAdminError)
                    throw creatorWfAdminError;
                resolvedDepartmentId = creatorWfAdmin?.department_id ? Number(creatorWfAdmin.department_id) : null;
                resolvedMunicipalityId = creatorWfAdmin?.municipality_id || resolvedMunicipalityId;
            }
            if ((user_role === 'workforce-admin' || user_role === 'workforce') && !resolvedDepartmentId && normalizedDepartmentName) {
                if (!resolvedMunicipalityId) {
                    return res.status(400).json({ error: 'Municipality is required to resolve department' });
                }
                const { data: existingDepartment, error: existingDepartmentError } = await db_1.supabase
                    .from('departments')
                    .select('id')
                    .eq('municipality_id', resolvedMunicipalityId)
                    .ilike('name', normalizedDepartmentName.trim())
                    .maybeSingle();
                if (existingDepartmentError)
                    throw existingDepartmentError;
                if (existingDepartment?.id) {
                    resolvedDepartmentId = Number(existingDepartment.id);
                }
                else {
                    const { data: createdDepartment, error: createdDepartmentError } = await db_1.supabase
                        .from('departments')
                        .insert([{ municipality_id: resolvedMunicipalityId, name: normalizedDepartmentName.trim() }])
                        .select('id')
                        .single();
                    if (createdDepartmentError)
                        throw createdDepartmentError;
                    resolvedDepartmentId = Number(createdDepartment.id);
                }
            }
            if ((user_role === 'workforce-admin' || user_role === 'workforce') && !resolvedDepartmentId) {
                return res.status(400).json({ error: `${user_role} requires a valid department` });
            }
            if (resolvedDepartmentId && resolvedMunicipalityId) {
                const { data: departmentRecord, error: departmentRecordError } = await db_1.supabase
                    .from('departments')
                    .select('id, municipality_id')
                    .eq('id', resolvedDepartmentId)
                    .maybeSingle();
                if (departmentRecordError)
                    throw departmentRecordError;
                if (!departmentRecord) {
                    return res.status(400).json({ error: 'Department not found' });
                }
                if (departmentRecord.municipality_id !== resolvedMunicipalityId) {
                    return res.status(400).json({ error: 'Department does not belong to the selected municipality' });
                }
            }
            // ── 1. Create user in Supabase Auth ─────────────────────────────────
            const { data: authData, error: authError } = await db_1.supabase.auth.admin.createUser({
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
            const { error: usersError } = await db_1.supabase.from('users').insert([{
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
            const salt = await bcryptjs_1.default.genSalt(10);
            const hashedPassword = await bcryptjs_1.default.hash(password, salt);
            const insertData = {
                id: userId,
                email,
                password_hash: hashedPassword, // FIX: was storing plaintext
                full_name: nameToUse,
                contact_number: phone,
                status: 'Active',
                email_verified: false,
            };
            if (user_role === 'admin') {
                table = 'admins';
                insertData.municipality_id = resolvedMunicipalityId;
            }
            else if (user_role === 'superadmin') {
                table = 'superadmins';
            }
            else if (user_role === 'workforce-admin') {
                table = 'workforce_admins';
                insertData.department_id = resolvedDepartmentId;
                insertData.municipality_id = resolvedMunicipalityId;
            }
            else if (user_role === 'workforce') {
                table = 'workforce_officers';
                insertData.employee_id = `EMP-${Math.floor(Math.random() * 10000)}`;
                insertData.department_id = resolvedDepartmentId;
                insertData.municipality_id = resolvedMunicipalityId;
                insertData.role = 'officer';
            }
            if (table) {
                const { error: roleError } = await db_1.supabase.from(table).insert([insertData]);
                if (roleError) {
                    console.error(`[provision] Failed to insert into ${table}:`, roleError);
                }
            }
            // ── 4. Issue OTP and send verification email ─────────────────────────
            try {
                const verificationCode = await issueVerificationToken(email, 'email_verify');
                await (0, emailService_1.sendVerificationEmail)(email, nameToUse, verificationCode);
            }
            catch (emailErr) {
                // Non-fatal: user is created, just log and continue
                console.error('[provision] Failed to send verification email:', emailErr);
            }
            return res.status(201).json({
                message: 'Provisioning successful. A verification email has been sent.',
                user_id: userId,
                role: user_role,
            });
        }
        catch (err) {
            console.error('[provision]', err);
            return res.status(500).json({ error: (0, errorResponse_1.serverErrorMessage)(err) });
        }
    },
    // ── Forgot Password ──────────────────────────────────────────────────────
    async forgotPassword(req, res) {
        try {
            const { email, contact_number, channel = 'email' } = req.body;
            if (channel !== 'email' && channel !== 'sms') {
                return res.status(400).json({ error: 'Invalid channel' });
            }
            if (channel === 'email' && !email) {
                return res.status(400).json({ error: 'Missing email' });
            }
            if (channel === 'sms' && !contact_number) {
                return res.status(400).json({ error: 'Missing contact number' });
            }
            let user = null;
            for (const table of USER_TABLES) {
                const query = db_1.supabase.from(table).select('id, email, full_name, contact_number');
                const { data } = channel === 'sms'
                    ? await query.eq('contact_number', contact_number).single()
                    : await query.eq('email', email).single();
                if (data) {
                    user = data;
                    break;
                }
            }
            const genericMessage = channel === 'sms'
                ? 'If an account with that number exists, a verification code has been sent.'
                : 'If an account with that email exists, a verification code has been sent.';
            if (!user) {
                return res.status(200).json({ message: genericMessage });
            }
            const otp = await issueVerificationToken(user.email, 'password_reset');
            if (channel === 'sms') {
                // Fire-and-forget — don't block response on SMS delivery
                (0, smsService_1.sendPasswordResetSms)(user.contact_number, otp).catch((err) => console.error('[forgotPassword] SMS send failed:', err));
            }
            else {
                // Fire-and-forget — don't block response on email delivery
                (0, emailService_1.sendVerificationEmail)(user.email, user.full_name || 'SeeBu User', otp).catch((err) => console.error('[forgotPassword] Email send failed:', err));
            }
            return res.status(200).json({ message: genericMessage });
        }
        catch (err) {
            console.error('[forgotPassword]', err);
            return res.status(500).json({ error: (0, errorResponse_1.serverErrorMessage)(err) });
        }
    },
    // ── Verify Reset Code (Step 2 of forgot-password) ────────────────────────
    async verifyResetCode(req, res) {
        try {
            const { email, code } = req.body;
            if (!email || !code) {
                return res.status(400).json({ error: 'Missing email or code' });
            }
            const { data: token, error: tokenError } = await db_1.supabase
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
        }
        catch (err) {
            console.error('[verifyResetCode]', err);
            return res.status(500).json({ error: (0, errorResponse_1.serverErrorMessage)(err) });
        }
    },
    // ── Reset Password (Step 3 of forgot-password) ───────────────────────────
    async resetPassword(req, res) {
        try {
            const { email, code, new_password } = req.body;
            if (!email || !code || !new_password) {
                return res.status(400).json({ error: 'Missing email, code, or new_password' });
            }
            if (new_password.length < 8) {
                return res.status(400).json({ error: 'Password must be at least 8 characters' });
            }
            // Re-validate the token before changing anything
            const { data: token, error: tokenError } = await db_1.supabase
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
            const salt = await bcryptjs_1.default.genSalt(10);
            const hashedPassword = await bcryptjs_1.default.hash(new_password, salt);
            // Update password across all user tables (only one will match)
            for (const table of USER_TABLES) {
                const { error: updateError } = await db_1.supabase
                    .from(table)
                    .update({ password_hash: hashedPassword })
                    .eq('email', email);
                if (updateError) {
                    console.error(`[resetPassword] Failed to update ${table}:`, updateError);
                }
            }
            // Delete the used token
            await db_1.supabase
                .from('verification_tokens')
                .delete()
                .eq('email', email)
                .eq('type', 'password_reset');
            return res.status(200).json({ message: 'Password reset successfully. You can now log in.' });
        }
        catch (err) {
            console.error('[resetPassword]', err);
            return res.status(500).json({ error: (0, errorResponse_1.serverErrorMessage)(err) });
        }
    },
    // ── Verify Email ─────────────────────────────────────────────────────────
    async verifyEmail(req, res) {
        try {
            const { email, code } = req.body;
            if (!email || !code) {
                return res.status(400).json({ error: 'Missing email or verification code' });
            }
            if (code.length !== 6) {
                return res.status(400).json({ error: 'Invalid verification code' });
            }
            const { data: token, error: tokenError } = await db_1.supabase
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
                await db_1.supabase
                    .from(table)
                    .update({ email_verified: true })
                    .eq('email', email);
            }
            // Delete the used token
            await db_1.supabase
                .from('verification_tokens')
                .delete()
                .eq('email', email)
                .eq('type', 'email_verify');
            return res.status(200).json({ message: 'Email verified successfully', email_verified: true });
        }
        catch (err) {
            console.error('[verifyEmail]', err);
            return res.status(500).json({ error: (0, errorResponse_1.serverErrorMessage)(err) });
        }
    },
    // ── Resend Verification ───────────────────────────────────────────────────
    async resendVerification(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ error: 'Missing email' });
            }
            // Find the user across all tables
            let user = null;
            for (const table of USER_TABLES) {
                const { data } = await db_1.supabase
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
            await (0, emailService_1.sendVerificationEmail)(email, user.full_name || 'SeeBu User', verificationCode);
            return res.status(200).json({ message: 'Verification code sent to your email' });
        }
        catch (err) {
            console.error('[resendVerification]', err);
            return res.status(500).json({ error: (0, errorResponse_1.serverErrorMessage)(err) });
        }
    },
};
