// Coordinates saved with a report ("Use my location").

// Generous box around Cebu City (same as the report form's). Coordinates outside it can't belong to
// a report in a Cebu City barangay, so they're dropped (the report itself is still accepted).
const SERVICE_AREA_BOX = { south: 10.22, north: 10.52, west: 123.7, east: 123.97 };

/** Both-or-neither, inside the service area, rounded to 6 decimals (~11 cm); otherwise null/null. */
export function reportCoordinates(lat?: number | null, lng?: number | null): { latitude: number | null; longitude: number | null } {
  const none = { latitude: null, longitude: null };
  if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng)) return none;
  const b = SERVICE_AREA_BOX;
  if (lat < b.south || lat > b.north || lng < b.west || lng > b.east) return none;
  return { latitude: Math.round(lat * 1e6) / 1e6, longitude: Math.round(lng * 1e6) / 1e6 };
}
