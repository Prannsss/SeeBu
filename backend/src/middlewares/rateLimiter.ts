import { Request } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

// Key by verified user id when a valid token is present (requests from the Next proxy all share
// one egress IP), otherwise by client IP. JWT_SECRET is read lazily: this module loads before dotenv.
function rateLimitKey(req: Request): string {
  const h = req.headers.authorization;
  if (h?.startsWith('Bearer ')) {
    try {
      const d: any = jwt.verify(h.slice(7), process.env.JWT_SECRET as string);
      if (d?.id) return `user:${d.id}`;
    } catch {}
  }
  return ipKeyGenerator(req.ip ?? '');
}

// Global Rate limiting
export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each user/IP to 500 requests per windowMs
  keyGenerator: rateLimitKey,
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Stricter limits for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 10 auth requests per windowMs
  message: {
    error: 'Too many authentication attempts from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Per-email limit on OTP verification endpoints (SEC-04: brute-forcing 6-digit codes)
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => {
    const e = String(req.body?.email || '').trim().toLowerCase();
    return e ? `otp:${e}` : ipKeyGenerator(req.ip ?? '');
  },
  message: {
    error: 'Too many verification attempts. Please request a new code or try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limit for endpoints that accept photo uploads (report creation, task completion)
export const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each user/IP to 30 submissions per windowMs
  keyGenerator: rateLimitKey,
  message: {
    error: 'Too many submissions from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Separate budget for pre-submit image scans so re-taking photos doesn't block submission
export const scanLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  keyGenerator: rateLimitKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many image scans, please wait a few minutes and try again' },
});
