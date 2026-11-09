// Runs every self-check (src/**/*.check.ts) and fails if any of them fails. `npm test` calls this.
// The checks never reach the network or the database; placeholder Supabase settings only let the
// modules that create a Supabase client load.
import { spawnSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const find = (dir) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  if (statSync(path).isDirectory()) return find(path);
  return name.endsWith('.check.ts') ? [path] : [];
});

const env = {
  ...process.env,
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key',
  JWT_SECRET: process.env.JWT_SECRET || 'test-secret',
};

let failed = 0;
for (const file of find(join(root, 'src')).sort()) {
  const name = relative(root, file);
  const run = spawnSync('npx', ['tsx', file], { cwd: root, env, encoding: 'utf8' });
  if (run.status === 0) {
    console.log(`PASS ${name}`);
  } else {
    failed++;
    console.log(`FAIL ${name}\n${(run.stderr || run.stdout).trim().split('\n').slice(-15).join('\n')}`);
  }
}
console.log(failed ? `\n${failed} check(s) failed` : '\nAll checks passed');
process.exit(failed ? 1 : 0);
