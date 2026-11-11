// Self-check for report type filtering. Run: npx tsx backend/src/utils/reportTypes.check.ts
import assert from 'node:assert/strict';
import { parseReportType, filterByReportType, REPORT_TYPES } from './reportTypes';

// Parsing: absent, known (any casing/whitespace), unknown
assert.equal(parseReportType(undefined), undefined);
assert.equal(parseReportType(''), undefined);
assert.equal(parseReportType('sanitation'), 'sanitation');
assert.equal(parseReportType(' Sanitation '), 'sanitation');
assert.equal(parseReportType('OTHER'), 'other');
assert.equal(parseReportType('garbage'), null);
assert.equal(parseReportType('sanitation,traffic'), null);
assert.equal(REPORT_TYPES.length, 7);

// Filtering: a named type is an exact match; "other" excludes every named type.
const calls: unknown[][] = [];
const fakeQuery: any = {
  eq: (...args: unknown[]) => { calls.push(['eq', ...args]); return fakeQuery; },
  not: (...args: unknown[]) => { calls.push(['not', ...args]); return fakeQuery; },
};
filterByReportType(fakeQuery, 'traffic');
filterByReportType(fakeQuery, 'other');
assert.deepEqual(calls, [
  ['eq', 'issue_type', 'traffic'],
  ['not', 'issue_type', 'in', '(infrastructure,sanitation,safety,traffic,utilities,environment)'],
]);

console.log('reportTypes.check PASS');
