//@ts-check

const path = require('path');
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next');

/** Load workspace-root `.env` when Nx runs Next with cwd `apps/web`. */
(function loadMonorepoEnv() {
  const envFile = path.join(__dirname, '../../.env');
  if (!fs.existsSync(envFile)) {
    return;
  }

  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq < 1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
})();

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  // Prisma ships native binaries do not bundle (avoids stale schema in Turbopack cache).
  serverExternalPackages: ['@prisma/client', 'prisma'],
  // Use this to set Nx-specific options
  // See: https://nx.dev/docs/technologies/react/next/Guides/next-config-setup
  nx: {},
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
