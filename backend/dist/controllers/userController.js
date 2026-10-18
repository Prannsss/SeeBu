"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = void 0;
const db_1 = require("../config/db");
const errorResponse_1 = require("../utils/errorResponse");
const accounts_1 = require("../utils/accounts");
const cache_1 = require("../utils/cache");
exports.userController = {
    async getCurrentUser(req, res) {
        try {
            const userReq = req.user;
            if (!userReq || !userReq.id || !userReq.role) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            // Map roles to tables
            let tableName = '';
            switch (userReq.role) {
                case 'client':
                    tableName = 'clients';
                    break;
                case 'admin':
                    tableName = 'admins';
                    break;
                case 'superadmin':
                    tableName = 'superadmins';
                    break;
                case 'workforce-admin':
                    tableName = 'workforce_admins';
                    break;
                case 'workforce':
                    tableName = 'workforce_officers';
                    break;
                default: return res.status(400).json({ error: 'Invalid user role' });
            }
            const { data, error } = await db_1.supabase
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
        }
        catch (err) {
            return res.status(500).json({ error: (0, errorResponse_1.serverErrorMessage)(err) });
        }
    },
    async updateCurrentUser(req, res) {
        try {
            const userReq = req.user;
            if (!userReq || !userReq.id || !userReq.role) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            let tableName = '';
            switch (userReq.role) {
                case 'client':
                    tableName = 'clients';
                    break;
                case 'admin':
                    tableName = 'admins';
                    break;
                case 'superadmin':
                    tableName = 'superadmins';
                    break;
                case 'workforce-admin':
                    tableName = 'workforce_admins';
                    break;
                case 'workforce':
                    tableName = 'workforce_officers';
                    break;
                default: return res.status(400).json({ error: 'Invalid user role' });
            }
            const { full_name, email, contact_number } = req.body;
            const updates = {};
            if (full_name !== undefined)
                updates.full_name = full_name;
            if (email !== undefined)
                updates.email = email;
            if (contact_number !== undefined)
                updates.contact_number = contact_number;
            if (email && await (0, accounts_1.emailExists)(email, userReq.id)) {
                return res.status(409).json({ error: 'This email is already in use.' });
            }
            const { error } = await db_1.supabase
                .from(tableName)
                .update(updates)
                .eq('id', userReq.id);
            if (error) {
                return res.status(500).json({ error: (0, errorResponse_1.serverErrorMessage)(error) });
            }
            await (0, cache_1.cacheDelPrefix)('users:');
            return res.status(200).json({ message: 'Profile updated successfully' });
        }
        catch (err) {
            return res.status(500).json({ error: (0, errorResponse_1.serverErrorMessage)(err) });
        }
    },
    async getAllUsers(req, res) {
        try {
            const tables = ['clients', 'admins', 'superadmins', 'workforce_admins', 'workforce_officers'];
            let allUsers = [];
            // Fetch municipality names once for mapping
            const { data: municipalities } = await db_1.supabase.from('municipalities').select('id, name');
            const munNameMap = {};
            (municipalities || []).forEach((m) => {
                munNameMap[m.id] = m.name;
            });
            for (const table of tables) {
                // Handle varying column names across tables, carefully alias them
                let selectQuery = 'id, email, status';
                if (table === 'clients' || table === 'admins' || table === 'superadmins' || table === 'workforce_admins' || table === 'workforce_officers') {
                    selectQuery += ', full_name';
                }
                if (table === 'admins' || table === 'workforce_admins' || table === 'workforce_officers') {
                    selectQuery += ', municipality_id';
                    const hasDept = table === 'workforce_admins' || table === 'workforce_officers';
                    if (hasDept)
                        selectQuery += ', department_id';
                }
                const { data: tbData, error } = await db_1.supabase.from(table).select(selectQuery).limit(100);
                if (tbData) {
                    allUsers = [...allUsers, ...tbData.map((u) => {
                            // Format area: convert 'cebu-city' to 'Cebu City'
                            let areaDisplay = 'Global';
                            if (u.municipality_id) {
                                const rawName = munNameMap[u.municipality_id] || u.municipality_id;
                                areaDisplay = rawName.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                            }
                            else if (u.department_id) {
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
        }
        catch (err) {
            return res.status(500).json({ error: (0, errorResponse_1.serverErrorMessage)(err) });
        }
    },
    async deleteCurrentUser(req, res) {
        try {
            const userReq = req.user;
            if (!userReq || !userReq.id || !userReq.role) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            let tableName = '';
            switch (userReq.role) {
                case 'client':
                    tableName = 'clients';
                    break;
                case 'admin':
                    tableName = 'admins';
                    break;
                case 'superadmin':
                    tableName = 'superadmins';
                    break;
                case 'workforce-admin':
                    tableName = 'workforce_admins';
                    break;
                case 'workforce':
                    tableName = 'workforce_officers';
                    break;
                default: return res.status(400).json({ error: 'Invalid user role' });
            }
            // Soft delete by updating status to 'Inactive' or hard delete
            // Using soft delete for data integrity
            const { error } = await db_1.supabase
                .from(tableName)
                .update({ status: 'Inactive' })
                .eq('id', userReq.id);
            if (error) {
                return res.status(500).json({ error: (0, errorResponse_1.serverErrorMessage)(error) });
            }
            // Drop the cached withAuth status so the deactivated account can't stay usable for the TTL
            await (0, cache_1.cacheDel)((0, cache_1.authStatusKey)(userReq.role, userReq.id));
            await (0, cache_1.cacheDelPrefix)('users:', 'departments:');
            return res.status(200).json({ message: 'Account deleted successfully' });
        }
        catch (err) {
            return res.status(500).json({ error: (0, errorResponse_1.serverErrorMessage)(err) });
        }
    }
};
