import { supabase } from '../config/db';

export const ACCOUNT_TABLES = [
  { table: 'superadmins', role: 'superadmin' },
  { table: 'admins', role: 'admin' },
  { table: 'workforce_admins', role: 'workforce-admin' },
  { table: 'workforce_officers', role: 'workforce' },
  { table: 'clients', role: 'client' },
] as const; // login precedence: staff before clients

/** Exact-email lookup across every account table, in ACCOUNT_TABLES order. */
export async function findAccountsByEmail(email: string): Promise<{ table: string; role: string; row: any }[]> {
  const results = await Promise.all(
    ACCOUNT_TABLES.map(({ table }) => supabase.from(table).select('*').eq('email', email).maybeSingle())
  );
  return results.flatMap(({ data, error }, i) => {
    if (error) throw error;
    return data ? [{ table: ACCOUNT_TABLES[i].table, role: ACCOUNT_TABLES[i].role, row: data }] : [];
  });
}

/** Case-insensitive check across every account table. Throws on query error (fail closed). */
export async function emailExists(email: string, excludeId?: string): Promise<boolean> {
  const escaped = String(email).trim().replace(/[\\%_]/g, (c) => `\\${c}`);
  const results = await Promise.all(
    ACCOUNT_TABLES.map(({ table }) => supabase.from(table).select('id').ilike('email', escaped))
  );
  return results.some(({ data, error }) => {
    if (error) throw error;
    return (data || []).some((r: any) => r.id !== excludeId);
  });
}
