// Self-check for report coordinates. Run: npx tsx backend/src/utils/coordinates.check.ts
import assert from 'node:assert/strict';
import { reportCoordinates } from './coordinates';

const none = { latitude: null, longitude: null };

// Inside Cebu City: kept, rounded to 6 decimals
assert.deepEqual(reportCoordinates(10.30481234567, 123.89301234567), { latitude: 10.304812, longitude: 123.893012 });
// Both or neither
assert.deepEqual(reportCoordinates(10.3048, null), none);
assert.deepEqual(reportCoordinates(undefined, 123.893), none);
assert.deepEqual(reportCoordinates(null, null), none);
// Outside the service area (Manila; far edge of the box)
assert.deepEqual(reportCoordinates(14.5995, 120.9842), none);
assert.deepEqual(reportCoordinates(10.3048, 124.1), none);
// Not numbers
assert.deepEqual(reportCoordinates(NaN, 123.893), none);
assert.deepEqual(reportCoordinates('10.3' as any, '123.8' as any), none);

console.log('coordinates.check PASS');
