// Self-check for the Turnstile gate (no network: siteverify is stubbed). Run: npx tsx src/utils/turnstile.check.ts
import assert from 'node:assert/strict';
import { verifyTurnstile } from './turnstile';

type Reply = { status?: number; body?: unknown; throws?: boolean };
let reply: Reply = {};
let lastBody: URLSearchParams | null = null;
(globalThis as any).fetch = async (_url: string, init: any) => {
  lastBody = init.body;
  if (reply.throws) throw new Error('network down');
  return { ok: (reply.status ?? 200) < 300, json: async () => reply.body };
};

const pass = { success: true, action: 'report', hostname: 'seebu.prannsss.dev' };

(async () => {
  process.env.TURNSTILE_SECRET = 'test-secret';
  process.env.FRONTEND_URL = 'https://seebu.prannsss.dev';
  delete process.env.TURNSTILE_HOSTNAMES;

  reply = { body: pass };
  assert.equal(await verifyTurnstile('tok', 'report', '203.0.113.7'), true, 'valid token');
  assert.equal(lastBody!.get('secret'), 'test-secret');
  assert.equal(lastBody!.get('response'), 'tok');
  assert.equal(lastBody!.get('remoteip'), '203.0.113.7');
  await verifyTurnstile('tok', 'report');
  assert.equal(lastBody!.get('remoteip'), null, 'remoteip omitted when unknown (proxied requests)');

  reply = { body: { ...pass, action: 'signup' } };
  assert.equal(await verifyTurnstile('tok', 'report'), false, 'wrong action');
  reply = { body: { ...pass, hostname: 'evil.example' } };
  assert.equal(await verifyTurnstile('tok', 'report'), false, 'wrong hostname');
  reply = { body: { ...pass, hostname: 'localhost' } };
  assert.equal(await verifyTurnstile('tok', 'report'), false, 'localhost is not a production host');
  reply = { body: { success: false, 'error-codes': ['timeout-or-duplicate'] } };
  assert.equal(await verifyTurnstile('tok', 'report'), false, 'replayed / expired token');
  reply = { status: 500, body: pass };
  assert.equal(await verifyTurnstile('tok', 'report'), false, 'siteverify 5xx fails closed');
  reply = { throws: true };
  assert.equal(await verifyTurnstile('tok', 'report'), false, 'network error fails closed');

  reply = { body: pass };
  for (const bad of [undefined, null, '', 42, 'x'.repeat(2049)]) {
    assert.equal(await verifyTurnstile(bad, 'report'), false, `rejects token ${String(bad).slice(0, 10)}`);
  }

  process.env.TURNSTILE_HOSTNAMES = 'seebu.prannsss.dev, www.seebu.prannsss.dev';
  reply = { body: { ...pass, hostname: 'www.seebu.prannsss.dev' } };
  assert.equal(await verifyTurnstile('tok', 'report'), true, 'TURNSTILE_HOSTNAMES overrides FRONTEND_URL');

  delete process.env.TURNSTILE_HOSTNAMES;
  delete process.env.FRONTEND_URL;
  reply = { body: pass };
  assert.equal(await verifyTurnstile('tok', 'report'), true, 'FRONTEND_URL unset: production host by default');
  reply = { body: { ...pass, hostname: 'localhost' } };
  assert.equal(await verifyTurnstile('tok', 'report'), false, 'default never allows localhost');
  process.env.FRONTEND_URL = 'not a url';
  reply = { body: pass };
  assert.equal(await verifyTurnstile('tok', 'report'), false, 'unparseable FRONTEND_URL fails closed');

  process.env.FRONTEND_URL = 'https://seebu.prannsss.dev';
  delete process.env.TURNSTILE_SECRET;
  assert.equal(await verifyTurnstile('tok', 'report'), false, 'missing secret fails closed');

  console.log('turnstile.check PASS');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
