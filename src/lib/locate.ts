/**
 * "Use my location" on the report form: a GPS fix → street address + municipality + barangay.
 *
 * - GPS: watches positions and stops as soon as one is precise enough (or after a short settle
 *   window, with the best one seen), falling back to a quick low-accuracy fix indoors.
 * - Address: Nominatim (exact road at the point) + Photon (nearest *named* street — in Cebu the
 *   closest OSM way is often an unnamed alley). All requests have timeouts.
 * - Barangay: Nominatim at barangay zoom (14) returns the barangay's own boundary when OSM has it,
 *   which is far more reliable than the zoom-18 address fields (e.g. Osmeña Blvd near Abellana
 *   reads "San Antonio / Calamba" at zoom 18 but sits inside the Sambag I boundary).
 */

import { fetchWithTimeout, nominatimJson } from "./geocode";

// ============================================================================================
// Place-name matching (pure; see locate.check.ts)
// ============================================================================================

// OSM spelling → ours, after normalization.
const ALIASES: Record<string, string> = {
  camputhaw: "kamputhaw",
  hippodromo: "hipodromo",
  tomaspadilla: "tpadilla",
  centralpoblacion: "central",
  poblacioncentral: "central",
  buot: "buottauppardo",
  buottaup: "buottauppardo",
};

/** Case-, accent-, punctuation- and numeral-insensitive key: "Sambag Ⅱ" = "Sambag II" = "Brgy. Sambag 2". */
export function normalizePlaceName(raw?: string | null): string {
  let s = (raw ?? "")
    .normalize("NFKD") // "Ⅱ" → "II", "ñ" → "n" + combining tilde
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
  s = s.replace(/\b(city of|municipality of|barangay|brgy|bgy)\b\.?/g, " ").replace(/\bcity\b/g, " ");
  s = s.replace(/\bsto\b\.?/g, "santo").replace(/\bsta\b\.?/g, "santa");
  s = s.replace(/\s+(1|one)\s*$/, " i").replace(/\s+(2|two)\s*$/, " ii");
  s = s.replace(/[^a-z0-9]/g, "");
  return ALIASES[s] ?? s;
}

/**
 * The first candidate (in priority order) that names an item in `list`: an exact normalized
 * match, or else a unique prefix ("Quiot" → "Quiot Pardo", but "Sambag" matches nothing).
 */
export function matchPlace<T extends { name: string }>(list: T[] | undefined, candidates: (string | null | undefined)[]): T | undefined {
  if (!list?.length) return undefined;
  const keyed = list.map((item) => ({ item, key: normalizePlaceName(item.name) }));
  for (const candidate of candidates) {
    const c = normalizePlaceName(candidate);
    if (!c) continue;
    const exact = keyed.find((k) => k.key === c);
    if (exact) return exact.item;
    if (c.length >= 4) {
      const prefixed = keyed.filter((k) => k.key.startsWith(c));
      if (prefixed.length === 1) return prefixed[0].item;
    }
  }
  return undefined;
}

// ============================================================================================
// GPS
// ============================================================================================

export type Fix = { lat: number; lng: number; accuracy: number };

export type LocateErrorCode = "unsupported" | "insecure" | "denied" | "unavailable";
export class LocateError extends Error {
  constructor(public code: LocateErrorCode) {
    super(code);
  }
}

/**
 * Best GPS fix within a few seconds. Resolves early once a fix is within `goodAccuracy` metres;
 * otherwise takes the best fix seen after `settleMs`. With no fix at all by `maxMs` (common
 * indoors with high accuracy), tries one quick low-accuracy fix (Wi-Fi/cell) before giving up.
 */
export function getBestPosition({ goodAccuracy = 30, settleMs = 5000, maxMs = 12000 } = {}): Promise<Fix> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return reject(new LocateError("unsupported"));
    if (typeof window !== "undefined" && window.isSecureContext === false) return reject(new LocateError("insecure"));

    let best: Fix | null = null;
    let done = false;
    let fellBack = false;
    let watchId: number | null = null;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const cleanup = () => {
      done = true;
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      timers.forEach(clearTimeout);
    };
    const finish = (fix: Fix) => {
      if (done) return;
      cleanup();
      resolve(fix);
    };
    const fail = (code: LocateErrorCode) => {
      if (done) return;
      cleanup();
      reject(new LocateError(code));
    };
    const fallback = () => {
      if (done || fellBack) return;
      if (best) return finish(best);
      fellBack = true;
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      watchId = null;
      timers.forEach(clearTimeout);
      navigator.geolocation.getCurrentPosition(
        (p) => finish({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
        (err) => fail(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable"),
        { enableHighAccuracy: false, maximumAge: 5 * 60_000, timeout: 8000 }
      );
    };

    watchId = navigator.geolocation.watchPosition(
      (p) => {
        const fix = { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy };
        if (!best || fix.accuracy < best.accuracy) best = fix;
        if (fix.accuracy <= goodAccuracy) finish(fix);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) fail("denied");
        else fallback(); // POSITION_UNAVAILABLE / TIMEOUT: use what we have, or try low accuracy
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: maxMs }
    );
    timers.push(setTimeout(() => best && finish(best), settleMs));
    timers.push(setTimeout(fallback, maxMs));
  });
}

// ============================================================================================
// Reverse geocoding
// ============================================================================================

type NominatimAddress = Record<string, string | undefined>;
type NominatimReverse = {
  name?: string;
  category?: string;
  type?: string;
  place_rank?: number;
  address?: NominatimAddress;
};

export type ReverseResult = {
  /** "123 Ascension Street, Pailob" — or "" when no named street is near. */
  street: string;
  /** Municipality names to try, best first. */
  municipalityCandidates: string[];
  /** Name of the barangay boundary containing the point, when OSM maps it (authoritative). */
  barangayBoundary?: string;
  /** Other barangay-ish names to try, best first (address fields, then nearby place names). */
  barangayCandidates: string[];
};

const reverseCache = new Map<string, ReverseResult>();
const compact = (values: (string | undefined | null)[]) => values.filter((v): v is string => !!v && !!v.trim());

export async function reverseGeocode(lat: number, lng: number): Promise<ReverseResult | null> {
  // ~11 m grid: tapping the button twice in the same spot costs nothing.
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  const hit = reverseCache.get(key);
  if (hit) return hit;

  const base = { lat: String(lat), lon: String(lng), format: "jsonv2", addressdetails: "1", "accept-language": "en" };
  // Both Nominatim calls share the app-wide 1 req/s queue; Photon runs alongside them.
  const [detail, area, photon] = await Promise.all([
    nominatimJson<NominatimReverse>("reverse", { ...base, zoom: "18" }),
    nominatimJson<NominatimReverse>("reverse", { ...base, zoom: "14" }),
    fetchWithTimeout(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&osm_tag=highway&limit=1&radius=0.3&lang=en`, 6000)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => (j?.features?.[0]?.properties ?? null) as { name?: string; district?: string; city?: string } | null)
      .catch(() => null),
  ]);
  if (!detail && !area && !photon) return null;

  const a = detail?.address ?? {};
  const houseNumber = a.house_number?.includes("+") ? undefined : a.house_number; // skip Plus Codes like "8WJ5+QC2"
  const road = a.road || photon?.name;
  // Sitio/neighbourhood after the street, e.g. "Fourth Street, Baca"; never a sitio alone as the "street"
  const street = road ? compact([compact([houseNumber, road]).join(" "), a.neighbourhood]).join(", ") : "";

  // Barangay-level result (rank 18–21): a mapped boundary is authoritative; a place node is a weak hint.
  const barangayLevel = area && (area.place_rank ?? 0) >= 18 && (area.place_rank ?? 0) <= 21;
  const isBoundary = barangayLevel && area!.category === "boundary" && area!.type === "administrative";
  const areaPlace = barangayLevel && area!.category === "place" ? area!.name : undefined;

  const result: ReverseResult = {
    street,
    // No `county`: in PH it can hold the province ("Cebu"), which would falsely match "Cebu City".
    municipalityCandidates: compact([a.city, a.town, a.municipality, area?.address?.city, area?.address?.town, area?.address?.municipality, photon?.city]),
    barangayBoundary: isBoundary ? area!.name : undefined,
    // Without a boundary, the zoom-18 address fields lead; the zoom-14 place node is only the nearest
    // named spot (e.g. it says "Lorega" for J. Joaquino St, where the address and Photon say Mabolo).
    barangayCandidates: compact([a.quarter, a.suburb, a.village, areaPlace, a.city_district, photon?.district, a.neighbourhood, a.hamlet]),
  };
  reverseCache.set(key, result);
  return result;
}
