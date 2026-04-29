"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const db_1 = require("../config/db");
const emailService_1 = require("../utils/emailService");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'seebu-super-secret-key-change-me';
exports.authController = {
    // Existing local register
    async registerClient(req, res) {
        try {
            const { email, password, full_name, contact_number } = req.body;
            if (!email || !password || !full_name) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            // Hash password using bcrypt
            const salt = await bcryptjs_1.default.genSalt(10);
            const hashedPassword = await bcryptjs_1.default.hash(password, salt);
            const { data, error } = await db_1.supabase
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
            await (0, emailService_1.sendWelcomeEmail)(email, full_name);
            return res.status(201).json({ message: 'Registration successful', data });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    },
    // OAuth Google Callback (Simulated / Simplified for custom table config)
    async googleOAuthCallback(req, res) {
        try {
            // In a real scenario, you'd exchange code for tokens via google-auth-library
            // For this implementation, we assume frontend sends the verified Google email/name
            const { email, full_name, google_id } = req.body;
            if (!email)
                return res.status(400).json({ error: "Missing OAuth email" });
            // Check if user already exists across tables, or strictly clients
            let { data: existingClient } = await db_1.supabase
                .from('clients')
                .select('*')
                .eq('email', email)
                .single();
            if (existingClient) {
                // They exist, log them in
                const token = jsonwebtoken_1.default.sign({ id: existingClient.id, role: 'client' }, JWT_SECRET, { expiresIn: '7d' });
                return res.status(200).json({ message: "Login successful", user: { ...existingClient, role: 'client' }, token });
            }
            // If they don't exist, we MUST register them STRICTLY as a client
            // Generate a random password hash since they use OAuth
            const salt = await bcryptjs_1.default.genSalt(10);
            const randomPassword = Math.random().toString(36).slice(-10);
            const hashedPassword = await bcryptjs_1.default.hash(randomPassword, salt);
            const { data: newClient, error } = await db_1.supabase
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
            if (error)
                throw error;
            // Welcome and verification triggers
            await (0, emailService_1.sendWelcomeEmail)(email, full_name || "Google User");
            const token = jsonwebtoken_1.default.sign({ id: newClient.id, role: 'client' }, JWT_SECRET, { expiresIn: '7d' });
            return res.status(201).json({
                message: "Registration successful via Google",
                user: { ...newClient, role: 'client' },
                token
            });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    },
    // Facebook Callback 
    async facebookOAuthCallback(req, res) {
        // Same logic as Google essentially, strictly clients table
        try {
            const { email, full_name } = req.body;
            if (!email)
                return res.status(400).json({ error: "Missing OAuth email" });
            let { data: existingClient } = await db_1.supabase.from('clients').select('*').eq('email', email).single();
            if (existingClient) {
                const token = jsonwebtoken_1.default.sign({ id: existingClient.id, role: 'client' }, JWT_SECRET, { expiresIn: '7d' });
                return res.status(200).json({ message: "Login successful", user: { ...existingClient, role: 'client' }, token });
            }
            const salt = await bcryptjs_1.default.genSalt(10);
            const hashedPassword = await bcryptjs_1.default.hash(Math.random().toString(36).slice(-10), salt);
            const { data: newClient, error } = await db_1.supabase
                .from('clients')
                .insert([{ email, password_hash: hashedPassword, full_name: full_name || "Facebook User", status: 'Active' }])
                .select('*')
                .single();
            if (error)
                throw error;
            await (0, emailService_1.sendWelcomeEmail)(email, full_name || "Facebook User");
            const token = jsonwebtoken_1.default.sign({ id: newClient.id, role: 'client' }, JWT_SECRET, { expiresIn: '7d' });
            return res.status(201).json({ message: "Registration successful via Facebook", user: { ...newClient, role: 'client' }, token });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    },
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
                const { data, error } = await db_1.supabase
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
            const isMatch = await bcryptjs_1.default.compare(password, user.password_hash);
            if (!isMatch) {
                // Fallback for plain text passwords in testing/legacy data if needed
                if (user.password_hash !== password) {
                    return res.status(401).json({ error: 'Invalid credentials' });
                }
            }
            user.role = userRole;
            const token = jsonwebtoken_1.default.sign({ id: user.id, role: userRole }, JWT_SECRET, { expiresIn: '7d' });
            return res.status(200).json({ message: 'Login successful', token, user: user });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    },
    async provision(req, res) {
        try {
            const { email, password, user_role, municipality_id, first_name, last_name, full_name, // legacy compat
            phone, department, department_id, department_name } = req.body;
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
            const departmentCandidate = department_id ?? department;
            const normalizedDepartmentName = department_name || (typeof departmentCandidate === 'string' && !/^\d+$/.test(departmentCandidate) ? departmentCandidate : null);
            let resolvedDepartmentId = null;
            if (typeof departmentCandidate === 'number' || (typeof departmentCandidate === 'string' && /^\d+$/.test(departmentCandidate))) {
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
            // 1. Create User in Supabase Auth via Admin API
            const { data: authData, error: authError } = await db_1.supabase.auth.admin.createUser({
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
            const { error: usersError } = await db_1.supabase
                .from('users')
                .insert([{
                    id: userId,
                    email,
                    role: user_role,
                    full_name: nameToUse,
                    contact_number: phone,
                    department_id: resolvedDepartmentId,
                }]);
            if (usersError) {
                // Warning: Might need to cleanup the auth user if this fails, but for now we proceed or return error
                console.error('Failed to insert into generic users table:', usersError);
                return res.status(500).json({ error: usersError.message });
            }
            // 3. (Optional) Insert into role-specific table if it exists
            // e.g. admins, superadmins, workforce_officers
            let table = '';
            const insertData = {
                id: userId,
                email,
                password_hash: password, // Still syncing for legacy login if needed
                full_name: nameToUse,
                contact_number: phone,
                status: 'Active'
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
                const { error: roleError } = await db_1.supabase
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
        }
        catch (err) {
            console.error('Provisioning error:', err);
            return res.status(500).json({ error: err.message });
        }
    },
    async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ error: 'Missing email' });
            }
            const tables = [
                'clients',
                'admins',
                'superadmins',
                'workforce_admins',
                'workforce_officers'
            ];
            let user = null;
            for (const table of tables) {
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
                // Returning 200 to prevent timing/enumeration trivially,
                // but with a distinctive payload as per user requirements
                return res.status(200).json({
                    found: false,
                    message: "Account not found."
                });
            }
            // Generate 6-digit OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
            // Upsert to verification_tokens
            // (Supabase allows upsert by specifying the UNIQUE constraint: email, type)
            const { error: tokenError } = await db_1.supabase
                .from('verification_tokens')
                .upsert({
                email: user.email,
                code: otp,
                type: 'password_reset',
                expires_at: expiresAt
            }, { onConflict: 'email,type' });
            if (tokenError) {
                console.error('Token generation error:', tokenError);
                return res.status(500).json({ error: 'Failed to generate reset token' });
            }
            // Fire and forget the email service to ensure fast response timing!
            (0, emailService_1.sendVerificationEmail)(user.email, user.full_name || 'SeeBu User', otp).catch(err => console.error('Failed to send forgot password email with Resend:', err));
            return res.status(200).json({
                found: true,
                message: 'A 6-digit verification code has been sent to your email.'
            });
        }
        catch (err) {
            console.error('Forgot password error:', err);
            // Return 500 cleanly
            return res.status(500).json({ error: err.message });
        }
    }
};
