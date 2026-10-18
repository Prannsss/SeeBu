"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authStatusKey = exports.cacheGeneration = void 0;
exports.cacheGet = cacheGet;
exports.cacheSet = cacheSet;
exports.cacheDel = cacheDel;
exports.cacheDelPrefix = cacheDelPrefix;
exports.cached = cached;
exports.invalidateWorkflowCaches = invalidateWorkflowCaches;
exports.cacheBackendName = cacheBackendName;
exports.closeCache = closeCache;
const ioredis_1 = __importDefault(require("ioredis"));
// Redis when REDIS_URL is set and reachable, otherwise an in-process memory cache.
// None of these functions throw or hang.
const NS = 'seebu:';
const MAX_MEMORY_ENTRIES = 2000;
const memory = new Map();
let client;
let lastLoggedStatus = '';
// An invalidation missed Redis (not ready or command failed); flushed on the next 'ready'.
let dirty = false;
// Bumped on every prefix invalidation so in-flight GETs don't re-cache pre-mutation data.
let generation = 0;
const cacheGeneration = () => generation;
exports.cacheGeneration = cacheGeneration;
function getClient() {
    if (client !== undefined)
        return client;
    const url = process.env.REDIS_URL;
    if (!url)
        return (client = null);
    client = new ioredis_1.default(url, {
        lazyConnect: true,
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
        connectTimeout: 3000,
        commandTimeout: 1000,
        retryStrategy: (n) => Math.min(n * 2000, 30000),
    });
    client.on('error', (err) => {
        if (lastLoggedStatus === 'error')
            return;
        lastLoggedStatus = 'error';
        console.warn('[cache] Redis unavailable, using memory fallback:', err.message);
    });
    client.on('ready', () => {
        lastLoggedStatus = 'ready';
        console.log('[cache] Redis connected');
        if (dirty) {
            dirty = false;
            void cacheDelPrefix('auth:status:', 'reports:', 'tasks:', 'analytics:', 'users:', 'departments:');
        }
    });
    client.connect().catch(() => { });
    return client;
}
function redis() {
    const c = getClient();
    return c && c.status === 'ready' ? c : null;
}
function memGet(key) {
    const entry = memory.get(key);
    if (!entry)
        return undefined;
    if (entry.exp <= Date.now()) {
        memory.delete(key);
        return undefined;
    }
    return entry.v;
}
function memSet(key, v, ttlSeconds) {
    memory.delete(key);
    memory.set(key, { v, exp: Date.now() + ttlSeconds * 1000 });
    if (memory.size > MAX_MEMORY_ENTRIES)
        memory.delete(memory.keys().next().value);
}
async function cacheGet(key) {
    const k = NS + key;
    try {
        const r = redis();
        const raw = r ? await r.get(k).catch(() => memGet(k)) : memGet(k);
        return raw == null ? undefined : JSON.parse(raw);
    }
    catch {
        return undefined;
    }
}
async function cacheSet(key, value, ttlSeconds) {
    const k = NS + key;
    try {
        const raw = JSON.stringify(value);
        if (raw === undefined)
            return;
        const r = redis();
        if (r) {
            try {
                await r.set(k, raw, 'EX', ttlSeconds);
                return;
            }
            catch { }
        }
        memSet(k, raw, ttlSeconds);
    }
    catch { }
}
async function cacheDel(...keys) {
    const ks = keys.map((key) => NS + key);
    ks.forEach((k) => memory.delete(k));
    const r = redis();
    if (!r) {
        if (getClient())
            dirty = true;
        return;
    }
    if (ks.length)
        await r.unlink(...ks).catch(() => { dirty = true; });
}
async function cacheDelPrefix(...prefixes) {
    generation++;
    for (const prefix of prefixes) {
        const p = NS + prefix;
        for (const k of [...memory.keys()])
            if (k.startsWith(p))
                memory.delete(k);
        const r = redis();
        if (!r) {
            if (getClient())
                dirty = true;
            continue;
        }
        try {
            await new Promise((resolve) => {
                const stream = r.scanStream({ match: p + '*', count: 200 });
                const pending = [];
                stream.on('data', (batch) => {
                    if (batch.length)
                        pending.push(r.unlink(...batch).catch(() => { dirty = true; }));
                });
                stream.on('end', () => Promise.all(pending).then(() => resolve()));
                stream.on('error', () => { dirty = true; resolve(); });
            });
        }
        catch { }
    }
}
async function cached(key, ttlSeconds, loader) {
    const hit = await cacheGet(key);
    if (hit !== undefined)
        return hit;
    const value = await loader();
    if (value !== undefined)
        await cacheSet(key, value, ttlSeconds);
    return value;
}
async function invalidateWorkflowCaches() {
    await cacheDelPrefix('reports:', 'tasks:', 'analytics:');
}
const authStatusKey = (role, id) => `auth:status:${role}:${id}`;
exports.authStatusKey = authStatusKey;
function cacheBackendName() {
    return redis() ? 'redis' : 'memory';
}
async function closeCache() {
    try {
        client?.disconnect();
    }
    catch { }
    client = undefined;
    memory.clear();
}
