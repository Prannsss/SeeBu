import Redis from 'ioredis';

// Redis when REDIS_URL is set and reachable, otherwise an in-process memory cache.
// None of these functions throw or hang.

const NS = 'seebu:';
const MAX_MEMORY_ENTRIES = 2000;
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

export async function cacheGet<T = unknown>(key: string): Promise<T | undefined> {
  const k = NS + key;
  try {
    const r = redis();
    const raw = r ? await r.get(k).catch(() => memGet(k)) : memGet(k);
    return raw == null ? undefined : (JSON.parse(raw) as T);
  } catch {
    return undefined;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const k = NS + key;
  try {
    const raw = JSON.stringify(value);
    if (raw === undefined) return;
    const r = redis();
    if (r) {
      try {
        await r.set(k, raw, 'EX', ttlSeconds);
        return;
      } catch {}
    }
    memSet(k, raw, ttlSeconds);
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

export async function cacheDelPrefix(...prefixes: string[]): Promise<void> {
  generation++;
  for (const prefix of prefixes) {
    const p = NS + prefix;
    for (const k of [...memory.keys()]) if (k.startsWith(p)) memory.delete(k);
    const r = redis();
    if (!r) {
      if (getClient()) dirty = true;
      continue;
    }
    try {
      await new Promise<void>((resolve) => {
        const stream = r.scanStream({ match: p + '*', count: 200 });
        const pending: Promise<unknown>[] = [];
        stream.on('data', (batch: string[]) => {
          if (batch.length) pending.push(r.unlink(...batch).catch(() => { dirty = true; }));
        });
        stream.on('end', () => Promise.all(pending).then(() => resolve()));
        stream.on('error', () => { dirty = true; resolve(); });
      });
    } catch {}
  }
}

export async function cached<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
  const hit = await cacheGet<T>(key);
  if (hit !== undefined) return hit;
  const value = await loader();
  if (value !== undefined) await cacheSet(key, value, ttlSeconds);
  return value;
}

export async function invalidateWorkflowCaches(): Promise<void> {
  await cacheDelPrefix('reports:', 'tasks:', 'analytics:');
}

export const authStatusKey = (role: string, id: string) => `auth:status:${role}:${id}`;

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
