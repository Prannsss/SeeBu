"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../config/db");
const JWT_SECRET = process.env.JWT_SECRET;
const ROLE_TABLES = {
    client: 'clients',
    admin: 'admins',
    superadmin: 'superadmins',
    'workforce-admin': 'workforce_admins',
    workforce: 'workforce_officers',
};
const withAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing or invalid authorization token' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const tableName = ROLE_TABLES[decoded?.role];
        if (!tableName || !decoded?.id) {
            return res.status(401).json({ error: 'Unauthorized Access' });
        }
        const { data: account } = decoded.role === 'admin'
            ? await db_1.supabase.from(tableName).select('status, municipality_id').eq('id', decoded.id).maybeSingle()
            : await db_1.supabase.from(tableName).select('status').eq('id', decoded.id).maybeSingle();
        if (!account || account.status !== 'Active') {
            return res.status(401).json({ error: 'Account is no longer active' });
        }
        req.user = decoded;
        if (decoded.role === 'admin') {
            req.user.municipality_id = account.municipality_id;
        }
        next();
    }
    catch (error) {
        console.error('Middleware Auth Error:', error.message);
        return res.status(401).json({ error: 'Unauthorized Access' });
    }
};
exports.withAuth = withAuth;
