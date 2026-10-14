// Self-check for the cache module (no DB). Run: npx tsx src/utils/cache.check.ts
import assert from 'node:assert/strict';
import { cacheGet, cacheSet, cacheDel, cacheDelPrefix, cached, cacheBackendName, closeCache } from './cache';

setTimeout(() => { console.error('FAIL: hang'); process.exit(1); }, 10000).unref();

async function main() {
  const t = `check:${Date.now()}:`;

  await cacheSet(t + 'obj', { a: 1, b: ['x'] }, 30);
  assert.deepEqual(await cacheGet(t + 'obj'), { a: 1, b: ['x'] });

  await cacheSet(t + 'short', 'v', 1);
  await new Promise((r) => setTimeout(r, 1200));
  assert.equal(await cacheGet(t + 'short'), undefined);

  await cacheSet('reports:' + t + 'a', 1, 30);
  await cacheSet('reports:' + t + 'b', 2, 30);
  await cacheSet('tasks:' + t + 'c', 3, 30);
  await cacheDelPrefix('reports:' + t);
  assert.equal(await cacheGet('reports:' + t + 'a'), undefined);
  assert.equal(await cacheGet('reports:' + t + 'b'), undefined);
  assert.equal(await cacheGet('tasks:' + t + 'c'), 3);

  let calls = 0;
  const loader = async () => { calls++; return { n: 42 }; };
  assert.deepEqual(await cached(t + 'cached', 30, loader), { n: 42 });
  assert.deepEqual(await cached(t + 'cached', 30, loader), { n: 42 });
  assert.equal(calls, 1);

  await cacheDel(t + 'obj', 'tasks:' + t + 'c');
  assert.equal(await cacheGet(t + 'obj'), undefined);
  assert.equal(await cacheGet('tasks:' + t + 'c'), undefined);

  console.log('cache backend:', cacheBackendName());
  await closeCache();
  console.log('cache.check PASS');
  process.exit(0);
}

main().catch((err) => {
  console.error('cache.check FAIL:', err);
  process.exit(1);
});
