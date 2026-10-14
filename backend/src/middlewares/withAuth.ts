import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/db';
import { cacheGet, cacheSet, authStatusKey } from '../utils/cache';

const JWT_SECRET = process.env.JWT_SECRET as string;

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

export const withAuth = async (req: Request, res: Response, next: NextFunction) => {
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
    let account = await cacheGet<{ status: string; municipality_id?: string | null }>(key);
    if (account === undefined) {
      const { data } = decoded.role === 'admin'
        ? await supabase.from(tableName).select('status, municipality_id').eq('id', decoded.id).maybeSingle()
        : await supabase.from(tableName).select('status').eq('id', decoded.id).maybeSingle();
      account = data ?? undefined;
      if (account) await cacheSet(key, account, 60);
    }

    if (!account || account.status !== 'Active') {
      return res.status(401).json({ error: 'Account is no longer active' });
    }

    req.user = decoded;
    if (decoded.role === 'admin') {
      req.user.municipality_id = (account as any).municipality_id;
    }

    next();
  } catch (error: any) {
    console.error('Middleware Auth Error:', error.message);
    return res.status(401).json({ error: 'Unauthorized Access' });
  }
};
