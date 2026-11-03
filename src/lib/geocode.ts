"use client";

/**
 * Forward geocoding of report addresses with OpenStreetMap Nominatim (free, no API key).
 *
 * Reports store a typed address (street, barangay, municipality), not coordinates, so the
 * map resolves each address to a point in the browser. Nominatim's usage policy allows at
 * most 1 request/second and asks clients to cache results, so:
 *  - every request goes through one module-wide queue spaced 1.1s apart (shared by all maps),
 *  - results (including misses) are cached in localStorage for 30 days,
 *  - identical addresses are only looked up once.
 * Each address falls back from street → barangay → municipality, so a pin usually lands
 * somewhere sensible; `precision` says which level matched.
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

// --- Rate-limited request queue (one in flight, 1.1s apart) ---------------------------------

let lastRequestAt = 0;
let chain: Promise<unknown> = Promise.resolve();
const inflight = new Map<string, Promise<{ lat: number; lng: number } | null>>();

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

/**
 * Every Nominatim request in the app goes through here: one at a time, at least 1.1s apart
 * (Nominatim's usage policy), each with a timeout. Resolves to the parsed JSON, or null on
 * any failure (network, timeout, 429/5xx).
 */
export function nominatimJson<T>(path: "search" | "reverse", params: Record<string, string>, timeoutMs = 8000): Promise<T | null> {
  const run = chain.then(async () => {
    const wait = lastRequestAt + REQUEST_GAP_MS - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastRequestAt = Date.now();
    try {
      const res = await fetchWithTimeout(`${NOMINATIM_BASE}/${path}?${new URLSearchParams(params)}`, timeoutMs, {
        headers: { Accept: "application/json" },
      });
      return res.ok ? ((await res.json()) as T) : null;
    } catch {
      return null;
    }
  });
  chain = run.catch(() => undefined);
  return run;
}

function search(query: string): Promise<{ lat: number; lng: number } | null> {
  const key = query.toLowerCase();
  const hit = cached(key);
  if (hit) return Promise.resolve("miss" in hit ? null : { lat: hit.lat, lng: hit.lng });
  const pending = inflight.get(key);
  if (pending) return pending;

  const run = nominatimJson<{ lat: string; lon: string }[]>("search", {
    q: query,
    format: "jsonv2",
    limit: "1",
    countrycodes: "ph",
    viewbox: CEBU_VIEWBOX,
    bounded: "1",
    "accept-language": "en",
  }).then((rows) => {
    if (!rows) return null; // failed: don't cache, try again next visit
    const row = rows[0];
    if (!row) {
      writeCache(key, { miss: true, t: Date.now() });
      return null;
    }
    const point = { lat: Number(row.lat), lng: Number(row.lon) };
    writeCache(key, { ...point, t: Date.now() });
    return point;
  });
  inflight.set(key, run);
  run.finally(() => inflight.delete(key));
  return run;
}

const clean = (value?: string | null) => {
  const v = (value || "").trim();
  return v && v !== "N/A" && v.toLowerCase() !== "unknown" ? v : "";
};

/** Street → barangay → municipality, stopping at the first level Nominatim can place. */
export async function geocodeAddress(address: GeoAddress): Promise<GeoPoint | null> {
  if (Number.isFinite(address.lat) && Number.isFinite(address.lng)) {
    return { lat: address.lat as number, lng: address.lng as number, precision: "exact" };
  }
  const street = clean(address.street);
  const barangay = clean(address.barangay);
  const municipality = clean(address.municipality);
  const tail = [municipality, "Cebu"].filter(Boolean).join(", ");

  const attempts: [string, GeoPrecision][] = [];
  if (street) attempts.push([[street, barangay, tail].filter(Boolean).join(", "), "street"]);
  if (barangay) attempts.push([[barangay, tail].join(", "), "barangay"]);
  if (municipality) attempts.push([tail, "municipality"]);

  for (const [query, precision] of attempts) {
    const point = await search(query);
    if (point) return { ...point, precision };
  }
  return null;
}

export const precisionLabel: Record<GeoPrecision, string> = {
  exact: "Exact location",
  street: "Street-level match",
  barangay: "Approximate · barangay center",
  municipality: "Approximate · city center",
};
