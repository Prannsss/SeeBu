// Self-check for analytics bucketing (no DB). Run: npx tsx src/controllers/analytics.check.ts
import assert from 'node:assert/strict';
import { summarize } from './analyticsController';

const area = () => 'X';
const rows = [
  // 20:00 UTC on Oct 17 is 04:00 on Oct 18 in Cebu — must land on Oct 18, not Oct 17.
  { status: 'Resolved', issue_type: 'garbage', created_at: '2026-10-17T20:00:00Z' },
  { status: 'Rejected', issue_type: 'garbage', created_at: '2026-10-18T01:00:00Z' },
  { status: 'Action Taken', issue_type: 'road', created_at: '2026-10-18T02:00:00Z' },
  { status: 'In Review', issue_type: 'road', created_at: '2026-10-18T03:00:00Z' },
];

const s = summarize(rows, '2026-10-16', '2026-10-18', area);
assert.deepEqual(s.range, { from: '2026-10-16', to: '2026-10-18', granularity: 'day' });
// Every day in range is present, empty ones as zero.
assert.deepEqual(s.chartData, [
  { date: '2026-10-16', reports: 0, resolved: 0 },
  { date: '2026-10-17', reports: 0, resolved: 0 },
  { date: '2026-10-18', reports: 4, resolved: 1 },
]);
// Rejected is its own bucket, never "in progress".
assert.deepEqual(s.totals, { total: 4, resolved: 1, inReview: 1, inProgress: 1, rejected: 1 });
// Rejected reports don't count as open issues of their type.
assert.deepEqual(s.issueTypeData, [
  { issueType: 'road', resolved: 0, unresolved: 2 },
  { issueType: 'garbage', resolved: 1, unresolved: 0 },
]);

// Long ranges switch to monthly buckets, still zero-filled.
const long = summarize(rows, '2026-06-01', '2026-10-31', area);
assert.equal(long.range.granularity, 'month');
assert.deepEqual(long.chartData.map((b) => b.date), ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10']);
assert.equal(long.chartData[4].reports, 4);

// Year rollover in monthly buckets.
assert.deepEqual(
  summarize([], '2026-11-15', '2027-03-01', area).chartData.map((b) => b.date),
  ['2026-11', '2026-12', '2027-01', '2027-02', '2027-03']
);

console.log('analytics.check PASS');
