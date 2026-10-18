// Self-check for invitation helpers. Run: npx tsx src/utils/staffInvites.check.ts
import assert from 'node:assert/strict';
import { passwordProblems, temporaryPassword, newInviteToken, hashInviteToken, inTeam } from './staffInvites';

assert.deepEqual(passwordProblems('Str0ng!pass'), []);
assert.deepEqual(passwordProblems('short1!'), ['at least 8 characters', 'an uppercase letter']);
assert.deepEqual(passwordProblems('NoDigitsHere!'), ['a number']);
assert.deepEqual(passwordProblems('NoSymbols123'), ['a special character']);
assert.ok(passwordProblems(undefined).includes('at least 8 characters'));
assert.ok(passwordProblems('Aa1!' + 'x'.repeat(80)).includes('no more than 72 characters'));

// Every generated temporary password must pass the same rules the user's own password must.
const seen = new Set<string>();
for (let i = 0; i < 2000; i++) {
  const pw = temporaryPassword();
  assert.equal(pw.length, 12);
  assert.deepEqual(passwordProblems(pw), [], pw);
  assert.ok(!/[0O1lI]/.test(pw), `look-alike character in ${pw}`);
  seen.add(pw);
}
assert.equal(seen.size, 2000, 'temporary passwords should not repeat');

const token = newInviteToken();
assert.equal(token.length, 43);
assert.equal(hashInviteToken(token), hashInviteToken(token));
assert.notEqual(hashInviteToken(token), hashInviteToken(newInviteToken()));

// Team scope decides who may see, cancel and revoke an invitation.
const cebuAdmin = { role: 'admin', municipality_id: 'cebu-city' };
const sanitationHead = { role: 'workforce-admin', department_id: 7 };
const coAdmin = { role: 'admin', municipality_id: 'cebu-city', department_id: null };
const deptHead = { role: 'workforce-admin', municipality_id: 'cebu-city', department_id: 7 };
const officer = { role: 'workforce', municipality_id: 'cebu-city', department_id: 7 };
assert.ok(inTeam(coAdmin, cebuAdmin));
assert.ok(inTeam(deptHead, cebuAdmin));
assert.ok(!inTeam(officer, cebuAdmin), "officers are their department head's team, not the admin's");
assert.ok(!inTeam({ ...coAdmin, municipality_id: 'mandaue' }, cebuAdmin), 'other municipality');
assert.ok(!inTeam(coAdmin, { role: 'admin', municipality_id: null }), 'admin without a municipality');
assert.ok(inTeam(officer, sanitationHead));
assert.ok(inTeam({ ...officer, department_id: '7' }, sanitationHead), 'ids may arrive as strings');
assert.ok(!inTeam({ ...officer, department_id: 8 }, sanitationHead), 'other department');
assert.ok(!inTeam(deptHead, sanitationHead), "department heads don't manage each other");
assert.ok(!inTeam(officer, { role: 'workforce-admin', department_id: null }), 'head without a department');
assert.ok(!inTeam(officer, { role: 'workforce', department_id: 7 }), 'officers manage no one');

console.log('staffInvites.check PASS');
