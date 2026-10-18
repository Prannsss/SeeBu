"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACCOUNT_TABLES = void 0;
exports.findAccountsByEmail = findAccountsByEmail;
exports.emailExists = emailExists;
const db_1 = require("../config/db");
exports.ACCOUNT_TABLES = [
    { table: 'superadmins', role: 'superadmin' },
    { table: 'admins', role: 'admin' },
    { table: 'workforce_admins', role: 'workforce-admin' },
    { table: 'workforce_officers', role: 'workforce' },
    { table: 'clients', role: 'client' },
]; // login precedence: staff before clients
/** Exact-email lookup across every account table, in ACCOUNT_TABLES order. */
async function findAccountsByEmail(email) {
    const results = await Promise.all(exports.ACCOUNT_TABLES.map(({ table }) => db_1.supabase.from(table).select('*').eq('email', email).maybeSingle()));
    return results.flatMap(({ data, error }, i) => {
        if (error)
            throw error;
        return data ? [{ table: exports.ACCOUNT_TABLES[i].table, role: exports.ACCOUNT_TABLES[i].role, row: data }] : [];
    });
}
/** Case-insensitive check across every account table. Throws on query error (fail closed). */
async function emailExists(email, excludeId) {
    const escaped = String(email).trim().replace(/[\\%_]/g, (c) => `\\${c}`);
    const results = await Promise.all(exports.ACCOUNT_TABLES.map(({ table }) => db_1.supabase.from(table).select('id').ilike('email', escaped)));
    return results.some(({ data, error }) => {
        if (error)
            throw error;
        return (data || []).some((r) => r.id !== excludeId);
    });
}
