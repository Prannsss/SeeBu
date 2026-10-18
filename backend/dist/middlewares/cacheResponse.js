"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheResponse = cacheResponse;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const cache_1 = require("../utils/cache");
// Per-caller scope so responses that depend on the caller never leak between users.
function cacheScope(req) {
    if (req.user)
        return `${req.user.role}:${req.user.id}`;
    const h = req.headers.authorization;
    if (h?.startsWith('Bearer ')) {
        try {
            const d = jsonwebtoken_1.default.verify(h.slice(7), process.env.JWT_SECRET);
            if (d?.id && d?.role)
                return `${d.role}:${d.id}`;
        }
        catch {
            // invalid/expired token — treated as anonymous
        }
    }
    return 'anon';
}
function cacheResponse(prefix, ttlSeconds) {
    return async (req, res, next) => {
        if (req.method !== 'GET')
            return next();
        const key = `${prefix}:${cacheScope(req)}:${req.originalUrl}`;
        const gen = (0, cache_1.cacheGeneration)();
        const hit = await (0, cache_1.cacheGet)(key);
        if (hit !== undefined) {
            res.setHeader('X-Cache', 'HIT');
            return res.status(200).json(hit);
        }
        res.setHeader('X-Cache', 'MISS');
        const orig = res.json.bind(res);
        res.json = (body) => {
            // Skip if an invalidation ran while this request was reading the DB
            if (res.statusCode === 200 && gen === (0, cache_1.cacheGeneration)())
                void (0, cache_1.cacheSet)(key, body, ttlSeconds);
            return orig(body);
        };
        next();
    };
}
