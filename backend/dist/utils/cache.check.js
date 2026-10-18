"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Self-check for the cache module (no DB). Run: npx tsx src/utils/cache.check.ts
const strict_1 = __importDefault(require("node:assert/strict"));
const cache_1 = require("./cache");
setTimeout(() => { console.error('FAIL: hang'); process.exit(1); }, 10000).unref();
async function main() {
    const t = `check:${Date.now()}:`;
    await (0, cache_1.cacheSet)(t + 'obj', { a: 1, b: ['x'] }, 30);
    strict_1.default.deepEqual(await (0, cache_1.cacheGet)(t + 'obj'), { a: 1, b: ['x'] });
    await (0, cache_1.cacheSet)(t + 'short', 'v', 1);
    await new Promise((r) => setTimeout(r, 1200));
    strict_1.default.equal(await (0, cache_1.cacheGet)(t + 'short'), undefined);
    await (0, cache_1.cacheSet)('reports:' + t + 'a', 1, 30);
    await (0, cache_1.cacheSet)('reports:' + t + 'b', 2, 30);
    await (0, cache_1.cacheSet)('tasks:' + t + 'c', 3, 30);
    await (0, cache_1.cacheDelPrefix)('reports:' + t);
    strict_1.default.equal(await (0, cache_1.cacheGet)('reports:' + t + 'a'), undefined);
    strict_1.default.equal(await (0, cache_1.cacheGet)('reports:' + t + 'b'), undefined);
    strict_1.default.equal(await (0, cache_1.cacheGet)('tasks:' + t + 'c'), 3);
    let calls = 0;
    const loader = async () => { calls++; return { n: 42 }; };
    strict_1.default.deepEqual(await (0, cache_1.cached)(t + 'cached', 30, loader), { n: 42 });
    strict_1.default.deepEqual(await (0, cache_1.cached)(t + 'cached', 30, loader), { n: 42 });
    strict_1.default.equal(calls, 1);
    await (0, cache_1.cacheDel)(t + 'obj', 'tasks:' + t + 'c');
    strict_1.default.equal(await (0, cache_1.cacheGet)(t + 'obj'), undefined);
    strict_1.default.equal(await (0, cache_1.cacheGet)('tasks:' + t + 'c'), undefined);
    console.log('cache backend:', (0, cache_1.cacheBackendName)());
    await (0, cache_1.closeCache)();
    console.log('cache.check PASS');
    process.exit(0);
}
main().catch((err) => {
    console.error('cache.check FAIL:', err);
    process.exit(1);
});
