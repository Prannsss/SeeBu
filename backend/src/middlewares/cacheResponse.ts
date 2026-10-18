import { Request, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { cacheGetRaw, cacheSet, cacheGeneration } from '../utils/cache';

// Per-caller scope so responses that depend on the caller never leak between users.
function cacheScope(req: Request): string {
  if (req.user) return `${req.user.role}:${req.user.id}`;
  const h = req.headers.authorization;
  if (h?.startsWith('Bearer ')) {
    try {
      const d = jwt.verify(h.slice(7), process.env.JWT_SECRET as string) as any;
      if (d?.id && d?.role) return `${d.role}:${d.id}`;
    } catch {
      // invalid/expired token — treated as anonymous
    }
  }
  return 'anon';
}

export function cacheResponse(prefix: string, ttlSeconds: number): RequestHandler {
  return async (req, res, next) => {
    if (req.method !== 'GET') return next();
    const key = `${prefix}:${cacheScope(req)}:${req.originalUrl}`;
    const gen = cacheGeneration();
    const hit = await cacheGetRaw(key);
    if (hit !== undefined) {
      res.setHeader('X-Cache', 'HIT');
      // Already JSON text: send as-is instead of parsing and re-serializing it.
      return res.status(200).type('application/json').send(hit);
    }
    res.setHeader('X-Cache', 'MISS');
    const orig = res.json.bind(res);
    res.json = (body) => {
      // Skip if an invalidation ran while this request was reading the DB
      if (res.statusCode === 200 && gen === cacheGeneration()) void cacheSet(key, body, ttlSeconds);
      return orig(body);
    };
    next();
  };
}
