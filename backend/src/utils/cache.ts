import Redis from 'ioredis';

// Two tiers: an in-process memory map (L1) in front of Redis (L2) when REDIS_URL is set.
// L1 answers repeat reads without an Upstash round trip (and without a billed command);
// without Redis, memory is the only tier. None of these functions throw or hang.

const NS = 'seebu:';
const MAX_MEMORY_ENTRIES = 2000;
// While Redis is up, L1 entries live at most this long. Invalidations clear L1 synchronously in
// this process, so the cap only bounds staleness if the backend ever runs as several instances.
const L1_MAX_TTL_SECONDS = 30;
// A value read from Redis has an unknown remaining TTL, so it is only promoted to L1 briefly.
const L1_PROMOTE_TTL_SECONDS = 5;
const memory = new Map<string, { v: string; exp: number }>();

let client: Redis | null | undefined;
let lastLoggedStatus = '';
// An invalidation missed Redis (not ready or command failed); flushed on the next 'ready'.
let dirty = false;
// Bumped on every prefix invalidation so in-flight GETs don't re-cache pre-mutation data.
let generation = 0;
export const cacheGeneration = () => generation;

function getClient(): Redis | null {
  if (client !== undefined) return client;
  const url = process.env.REDIS_URL;
  if (!url) return (client = null);
  client = new Redis(url, {
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    connectTimeout: 3000,
    commandTimeout: 1000,
    retryStrategy: (n) => Math.min(n * 2000, 30000),
  });
  client.on('error', (err) => {
    if (lastLoggedStatus === 'error') return;
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
  client.connect().catch(() => {});
  return client;
}

function redis(): Redis | null {
  const c = getClient();
  return c && c.status === 'ready' ? c : null;
}

function memGet(key: string): string | undefined {
  const entry = memory.get(key);
  if (!entry) return undefined;
  if (entry.exp <= Date.now()) {
    memory.delete(key);
    return undefined;
  }
  return entry.v;
}

function memSet(key: string, v: string, ttlSeconds: number) {
  memory.delete(key);
  memory.set(key, { v, exp: Date.now() + ttlSeconds * 1000 });
  if (memory.size > MAX_MEMORY_ENTRIES) memory.delete(memory.keys().next().value as string);
}

/** The cached JSON text, unparsed — lets HTTP responses be sent without a parse/stringify round. */
export async function cacheGetRaw(key: string): Promise<string | undefined> {
  const k = NS + key;
  try {
    const local = memGet(k);
    if (local !== undefined) return local;
    const r = redis();
    if (!r) return undefined;
    const gen = generation;
    const raw = await r.get(k).catch(() => null);
    if (raw == null) return undefined;
    // Don't promote a value an invalidation raced past while the GET was in flight.
    if (gen === generation) memSet(k, raw, L1_PROMOTE_TTL_SECONDS);
    return raw;
  } catch {
    return undefined;
  }
}

export async function cacheGet<T = unknown>(key: string): Promise<T | undefined> {
  const raw = await cacheGetRaw(key);
  if (raw === undefined) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

/** L1 is written synchronously, so callers may fire-and-forget the Redis write with `void`. */
export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const k = NS + key;
  try {
    const raw = JSON.stringify(value);
    if (raw === undefined) return;
    const r = redis();
    memSet(k, raw, r ? Math.min(ttlSeconds, L1_MAX_TTL_SECONDS) : ttlSeconds);
    if (r) await r.set(k, raw, 'EX', ttlSeconds).catch(() => {});
  } catch {}
}

export async function cacheDel(...keys: string[]): Promise<void> {
  const ks = keys.map((key) => NS + key);
  ks.forEach((k) => memory.delete(k));
  const r = redis();
  if (!r) {
    if (getClient()) dirty = true;
    return;
  }
  if (ks.length) await r.unlink(...ks).catch(() => { dirty = true; });
}

async function redisDelPrefix(r: Redis, p: string): Promise<void> {
  await new Promise<void>((resolve) => {
    const stream = r.scanStream({ match: p + '*', count: 200 });
    const pending: Promise<unknown>[] = [];
    stream.on('data', (batch: string[]) => {
      if (batch.length) pending.push(r.unlink(...batch).catch(() => { dirty = true; }));
    });
    stream.on('end', () => Promise.all(pending).then(() => resolve()));
    stream.on('error', () => { dirty = true; resolve(); });
  });
}

export async function cacheDelPrefix(...prefixes: string[]): Promise<void> {
  generation++;
  const ps = prefixes.map((prefix) => NS + prefix);
  for (const k of [...memory.keys()]) if (ps.some((p) => k.startsWith(p))) memory.delete(k);
  const r = redis();
  if (!r) {
    if (getClient()) dirty = true;
    return;
  }
  // Scan the prefixes in parallel: mutations await this before responding.
  await Promise.all(ps.map((p) => redisDelPrefix(r, p).catch(() => { dirty = true; })));
}

export async function cached<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
  const hit = await cacheGet<T>(key);
  if (hit !== undefined) return hit;
  const gen = generation;
  const value = await loader();
  if (value !== undefined && gen === generation) await cacheSet(key, value, ttlSeconds);
  return value;
}

export async function invalidateWorkflowCaches(): Promise<void> {
  await cacheDelPrefix('reports:', 'tasks:', 'analytics:');
}

export const authStatusKey = (role: string, id: string) => `auth:status:v2:${role}:${id}`;

export function cacheBackendName(): 'redis' | 'memory' {
  return redis() ? 'redis' : 'memory';
}

export async function closeCache(): Promise<void> {
  try {
    client?.disconnect();
  } catch {}
  client = undefined;
  memory.clear();
}
