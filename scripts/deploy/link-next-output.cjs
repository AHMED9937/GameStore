/**
 * After Next builds to apps/web/.next, verify routes-manifest and symlink
 * repo-root .next → apps/web/.next so Vercel finds output whether it looks at
 * `/vercel/path0/.next` (Root Directory empty) or `apps/web/.next` (Nx docs).
 */
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const nextOut = path.join(root, 'apps/web/.next');
const routesManifest = path.join(nextOut, 'routes-manifest.json');
const rootNext = path.join(root, '.next');

function fail(message) {
  console.error(`\n[vercel-link-next] ${message}\n`);
  process.exit(1);
}

if (!fs.existsSync(nextOut)) {
  fail(`Missing build output: ${nextOut}`);
}

if (!fs.existsSync(routesManifest)) {
  fail(
    `Missing ${routesManifest}. next build did not finish correctly (check build logs above).`,
  );
}

fs.rmSync(rootNext, { recursive: true, force: true });

try {
  fs.symlinkSync(nextOut, rootNext, 'dir');
} catch (error) {
  // Windows local fallback; Vercel (Linux) should use symlink.
  const code = error && typeof error === 'object' ? error.code : undefined;
  if (code === 'EPERM' || code === 'EEXIST') {
    fs.cpSync(nextOut, rootNext, { recursive: true });
  } else {
    throw error;
  }
}

console.log(
  `[vercel-link-next] OK — routes-manifest present; linked ${rootNext} -> ${nextOut}`,
);
