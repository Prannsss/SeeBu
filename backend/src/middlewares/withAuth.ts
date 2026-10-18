import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/db';
import { cacheGet, cacheSet, authStatusKey } from '../utils/cache';

const JWT_SECRET = process.env.JWT_SECRET as string;

// Scope columns cached alongside the account status (admins: municipality, workforce admins: department).
const SCOPE_COLUMNS: Record<string, string> = {
  admin: 'status, municipality_id',
  'workforce-admin': 'status, department_id',
};

const ROLE_TABLES: Record<string, string> = {
  client: 'clients',
  admin: 'admins',
  superadmin: 'superadmins',
  'workforce-admin': 'workforce_admins',
  workforce: 'workforce_officers',
};

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Invited staff sign in with status 'Pending Setup' and may only choose their own password
// (routes using withAuthDuringSetup); everything else needs an 'Active' account.
function authenticate({ allowPendingSetup }: { allowPendingSetup: boolean }) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid authorization token' });
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      const tableName = ROLE_TABLES[decoded?.role];
      if (!tableName || !decoded?.id) {
        return res.status(401).json({ error: 'Unauthorized Access' });
      }

      const key = authStatusKey(decoded.role, decoded.id);
      let account = await cacheGet<{ status: string; municipality_id?: string | null; department_id?: number | null }>(key);
      if (account === undefined) {
        const { data } = await supabase
          .from(tableName)
          .select(SCOPE_COLUMNS[decoded.role] || 'status')
          .eq('id', decoded.id)
          .maybeSingle();
        account = (data as any) ?? undefined;
        if (account) void cacheSet(key, account, 60); // L1 is set synchronously; don't wait on Redis
      }

      const usable = account?.status === 'Active' || (allowPendingSetup && account?.status === 'Pending Setup');
      if (!account || !usable) {
        if (account?.status === 'Pending Setup') {
          return res.status(403).json({
            error: 'Please set a new password to finish setting up your account.',
            code: 'PASSWORD_CHANGE_REQUIRED',
          });
        }
        return res.status(401).json({ error: 'Account is no longer active' });
      }

      req.user = decoded;
      if (decoded.role === 'admin') {
        req.user.municipality_id = account.municipality_id;
      }
      if (decoded.role === 'workforce-admin') {
        req.user.department_id = account.department_id;
      }

      next();
    } catch (error: any) {
      console.error('Middleware Auth Error:', error.message);
      return res.status(401).json({ error: 'Unauthorized Access' });
    }
  };
}

export const withAuth = authenticate({ allowPendingSetup: false });
/** Also admits invited staff who haven't chosen their own password yet. */
export const withAuthDuringSetup = authenticate({ allowPendingSetup: true });
