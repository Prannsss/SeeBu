"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanLimiter = exports.reportLimiter = exports.otpLimiter = exports.authLimiter = exports.limiter = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_rate_limit_1 = __importStar(require("express-rate-limit"));
// Key by verified user id when a valid token is present (requests from the Next proxy all share
// one egress IP), otherwise by client IP. JWT_SECRET is read lazily: this module loads before dotenv.
function rateLimitKey(req) {
    const h = req.headers.authorization;
    if (h?.startsWith('Bearer ')) {
        try {
            const d = jsonwebtoken_1.default.verify(h.slice(7), process.env.JWT_SECRET);
            if (d?.id)
                return `user:${d.id}`;
        }
        catch { }
    }
    return (0, express_rate_limit_1.ipKeyGenerator)(req.ip ?? '');
}
// Global Rate limiting
exports.limiter = (0, express_rate_limit_1.default)({
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
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 10 auth requests per windowMs
    message: {
        error: 'Too many authentication attempts from this IP, please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Per-email limit on OTP verification endpoints (SEC-04: brute-forcing 6-digit codes)
exports.otpLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    keyGenerator: (req) => {
        const e = String(req.body?.email || '').trim().toLowerCase();
        return e ? `otp:${e}` : (0, express_rate_limit_1.ipKeyGenerator)(req.ip ?? '');
    },
    message: {
        error: 'Too many verification attempts. Please request a new code or try again in 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Limit for endpoints that accept photo uploads (report creation, task completion)
exports.reportLimiter = (0, express_rate_limit_1.default)({
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
exports.scanLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 120,
    keyGenerator: rateLimitKey,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many image scans, please wait a few minutes and try again' },
});
