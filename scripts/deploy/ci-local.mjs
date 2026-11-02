// @ts-check
/**
 * Local mirror of the GitHub Actions `build-and-test` job (.github/workflows/ci.yml).
 *
 * Purpose: run EXACTLY what CI runs, in the same environment, so a push can't fail
 * CI for something we could have caught locally. Run it before every push:
 *
 *   pnpm ci:check
 *
 * It reproduces CI's bare environment on purpose:
 *   - NX_DAEMON / NX_CLOUD disabled, matching the workflow `env:` block.
 *   - DATABASE_URL / DIRECT_URL blanked, so the workspace-root `.env` is NOT
 *     injected into the web build (see the `=== undefined` guard in
 *     apps/web/next.config.js). CI has no `.env` and no DATABASE_URL, so the
 *     production build must succeed without a live database connection.
 *
 * If any step fails, this exits non-zero and names the step. Do not push until it
 * prints the final success line.
 */
import { execSync } from 'node:child_process';

/** The build-and-test job steps, in order, as the workflow runs them. */
const steps = [
  ['Install dependencies (frozen lockfile)', 'pnpm install --frozen-lockfile'],
  ['Generate Prisma client', 'pnpm db:generate'],
  ['Verify Vercel config', 'pnpm run deploy:vercel-config:test'],
  ['Verify Railway config', 'pnpm run deploy:railway-config:test'],
  ['Build NestJS API', 'pnpm nx build api --parallel=1'],
  ['Build Next.js web (Vercel command)', 'pnpm run vercel-build'],
  ['Lint all projects', 'pnpm nx run-many -t lint --all --parallel=3'],
];

const env = {
  ...process.env,
  NX_DAEMON: 'false',
  NX_CLOUD: 'false',
  // Reproduce CI's no-database build environment (see header).
  DATABASE_URL: '',
  DIRECT_URL: '',
};

console.log('> Local CI mirror (.github/workflows/ci.yml -> build-and-test)');
const started = Date.now();

for (const [label, cmd] of steps) {
  console.log(`\n-- ${label}\n   $ ${cmd}`);
  try {
    execSync(cmd, { stdio: 'inherit', env });
  } catch {
    console.error(`\nx CI mirror FAILED at: ${label}`);
    console.error('  Fix this before pushing - CI would fail here too.');
    process.exit(1);
  }
}

const secs = Math.round((Date.now() - started) / 1000);
console.log(`\nOK CI mirror passed in ${secs}s - safe to push.`);
