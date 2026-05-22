import rateLimit from 'express-rate-limit';

// Global Rate limiting
export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 100 requests per windowMs
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

// Even stricter for report creation
export const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 report creations per windowMs
  message: {
    error: 'Too many reports created from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
