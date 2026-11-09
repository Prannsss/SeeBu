"use client";

/**
 * Forward geocoding of report addresses with OpenStreetMap Nominatim (free, no API key).
 *
 * Reports can carry GPS coordinates from "Use my location" (migration 005); those are pinned
 * directly. Geocoding is only the fallback for reports without them (typed addresses and older
 * reports): the map resolves the address (street, barangay, municipality) to a point in the
 * browser. Nominatim's usage policy allows at
 * most 1 request/second and asks clients to cache results, so:
 *  - every request goes through one module-wide priority queue spaced 1.1s apart,
 *  - results (including misses) are cached in localStorage for 30 days,
 *  - identical addresses are only looked up once.
 * Pins are placed in two passes: barangay centers first (few lookups, shared by many reports),
 * then street-level refinement; `precision` says which level matched.
 */

export type GeoPrecision = "exact" | "street" | "barangay" | "municipality";

export type GeoPoint = { lat: number; lng: number; precision: GeoPrecision };

export type GeoAddress = {
  street?: string | null;
  barangay?: string | null;
  municipality?: string | null;
  /** Use stored coordinates when a record has them (skips geocoding entirely). */
  lat?: number | null;
  lng?: number | null;
};

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const CACHE_KEY = "seebu-geocode-v1";
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MISS_TTL_MS = 3 * 24 * 60 * 60 * 1000;
const REQUEST_GAP_MS = 1100;
// Cebu province, so "Lahug" or "Poblacion" never resolve to a namesake elsewhere in the country.
const CEBU_VIEWBOX = "123.25,11.35,124.15,9.40";

/** Cebu City Hall: where the map opens before anything is pinned. */
export const DEFAULT_CENTER: [number, number] = [10.2929, 123.9019];

type CacheEntry = { lat: number; lng: number; t: number } | { miss: true; t: number };

let memoryCache: Record<string, CacheEntry> | null = null;

function readCache(): Record<string, CacheEntry> {
  if (memoryCache) return memoryCache;
  try {
    memoryCache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  } catch {
    memoryCache = {};
  }
  return memoryCache!;
}

function writeCache(key: string, entry: CacheEntry) {
  const cache = readCache();
  cache[key] = entry;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Storage full or blocked: the in-memory copy still serves this session.
  }
}

function cached(key: string): CacheEntry | undefined {
  const entry = readCache()[key];
  if (!entry) return undefined;
  const ttl = "miss" in entry ? MISS_TTL_MS : CACHE_TTL_MS;
  return Date.now() - entry.t < ttl ? entry : undefined;
}

// --- Rate-limited request queue ------------------------------------------------------------
// One request in flight, at least 1.1s apart, highest priority first (then oldest). Jobs whose
// callers have all gone away (e.g. the map switched tabs) are dropped without using a slot.

/** Hand one to a lookup; set `cancelled` when you no longer need the answer. */
export type GeoToken = { cancelled: boolean };

/** Priorities: the reporter's own lookups and the selected pin jump ahead of bulk pin placement. */
export const PRIORITY = { interactive: 10, selected: 5, area: 1, street: 0 } as const;

type Job = { priority: number; seq: number; wanted: () => boolean; run: () => Promise<void>; skip: () => void };

let lastRequestAt = 0;
let seq = 0;
let pumping = false;
const jobs: Job[] = [];

async function pump() {
  if (pumping) return;
  pumping = true;
  try {
    while (jobs.length) {
      jobs.sort((a, b) => b.priority - a.priority || a.seq - b.seq);
      const job = jobs.shift()!;
      if (!job.wanted()) {
        job.skip();
        continue;
      }
      const wait = lastRequestAt + REQUEST_GAP_MS - Date.now();
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      lastRequestAt = Date.now();
      await job.run();
    }
  } finally {
    pumping = false;
  }
}

/** fetch() that gives up after `ms` (AbortSignal.timeout isn't in every browser we support). */
export async function fetchWithTimeout(url: string, ms: number, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function getJson<T>(path: "search" | "reverse", params: Record<string, string>, timeoutMs: number): Promise<T | null> {
  try {
    const res = await fetchWithTimeout(`${NOMINATIM_BASE}/${path}?${new URLSearchParams(params)}`, timeoutMs, {
      headers: { Accept: "application/json" },
    });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

/**
 * Every Nominatim request in the app goes through the queue. Resolves to the parsed JSON, or
 * null on any failure (network, timeout, 429/5xx).
 */
export function nominatimJson<T>(path: "search" | "reverse", params: Record<string, string>, timeoutMs = 8000): Promise<T | null> {
  return new Promise((resolve) => {
    jobs.push({
      priority: PRIORITY.interactive,
      seq: seq++,
      wanted: () => true,
      run: () => getJson<T>(path, params, timeoutMs).then(resolve),
      skip: () => resolve(null),
    });
    void pump();
  });
}

type Point = { lat: number; lng: number };
// Shared lookups: several pins in one barangay ask once. `undefined` = skipped (nobody wanted it).
const inflight = new Map<string, { promise: Promise<Point | null | undefined>; job: Job; tokens: Set<GeoToken> }>();

function search(query: string, priority: number, token?: GeoToken): Promise<Point | null | undefined> {
  const key = query.toLowerCase();
  const hit = cached(key);
  if (hit) return Promise.resolve("miss" in hit ? null : { lat: hit.lat, lng: hit.lng });

  const holder = token ?? { cancelled: false };
  const pending = inflight.get(key);
  if (pending) {
    pending.tokens.add(holder);
    pending.job.priority = Math.max(pending.job.priority, priority);
    return pending.promise;
  }

  const tokens = new Set<GeoToken>([holder]);
  let job!: Job;
  const promise = new Promise<Point | null | undefined>((resolve) => {
    job = {
      priority,
      seq: seq++,
      wanted: () => [...tokens].some((t) => !t.cancelled),
      skip: () => resolve(undefined),
      run: async () => {
        const rows = await getJson<{ lat: string; lon: string }[]>("search", {
          q: query,
          format: "jsonv2",
          limit: "1",
          countrycodes: "ph",
          viewbox: CEBU_VIEWBOX,
          bounded: "1",
          "accept-language": "en",
        }, 8000);
        if (!rows) return resolve(null); // failed: don't cache, try again next visit
        const row = rows[0];
        if (!row) {
          writeCache(key, { miss: true, t: Date.now() });
          return resolve(null);
        }
        const point = { lat: Number(row.lat), lng: Number(row.lon) };
        writeCache(key, { ...point, t: Date.now() });
        resolve(point);
      },
    };
  });
  inflight.set(key, { promise, job, tokens });
  promise.finally(() => inflight.delete(key));
  jobs.push(job);
  void pump();
  return promise;
}

const clean = (value?: string | null) => {
  const v = (value || "").trim();
  return v && v !== "N/A" && v.toLowerCase() !== "unknown" ? v : "";
};

const tailOf = (address: GeoAddress) => [clean(address.municipality), "Cebu"].filter(Boolean).join(", ");

export const hasExactPoint = (address: GeoAddress) => Number.isFinite(address.lat) && Number.isFinite(address.lng);

/**
 * Barangay center (or city center if the barangay isn't on OSM). Cheap for many pins: every
 * report in the same barangay shares one cached lookup. `undefined` = skipped (cancelled).
 */
export async function geocodeArea(address: GeoAddress, priority: number = PRIORITY.area, token?: GeoToken): Promise<GeoPoint | null | undefined> {
  if (hasExactPoint(address)) return { lat: address.lat as number, lng: address.lng as number, precision: "exact" };
  const barangay = clean(address.barangay);
  const tail = tailOf(address);
  if (barangay) {
    const point = await search(`${barangay}, ${tail}`, priority, token);
    if (point === undefined) return undefined;
    if (point) return { ...point, precision: "barangay" };
  }
  if (!clean(address.municipality)) return null;
  const point = await search(tail, priority, token);
  return point === undefined ? undefined : point ? { ...point, precision: "municipality" } : null;
}

/** Street-level point, or null when the street isn't on OSM. `undefined` = skipped (cancelled). */
export async function geocodeStreet(address: GeoAddress, priority: number = PRIORITY.street, token?: GeoToken): Promise<GeoPoint | null | undefined> {
  if (hasExactPoint(address)) return { lat: address.lat as number, lng: address.lng as number, precision: "exact" };
  const street = clean(address.street);
  if (!street) return null;
  const point = await search([street, clean(address.barangay), tailOf(address)].filter(Boolean).join(", "), priority, token);
  return point === undefined ? undefined : point ? { ...point, precision: "street" } : null;
}

/** Spread pins that share a point (e.g. several reports placed at the same barangay center). */
export function offsetDuplicate(point: GeoPoint, index: number): GeoPoint {
  if (index === 0) return point;
  const angle = index * 2.399963; // golden angle: an even spiral
  const radius = 0.00018 * Math.sqrt(index); // ~20 m per ring
  return { ...point, lat: point.lat + radius * Math.cos(angle), lng: point.lng + radius * Math.sin(angle) };
}

export const precisionLabel: Record<GeoPrecision, string> = {
  exact: "Exact location",
  street: "Street-level match",
  barangay: "Approximate · barangay center",
  municipality: "Approximate · city center",
};
