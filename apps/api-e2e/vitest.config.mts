import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

const workspaceRoot = resolve(__dirname, '../..');
const env = loadEnv('test', workspaceRoot, '');

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/api-e2e',
  plugins: [nxViteTsPaths()],
  test: {
    name: 'api-e2e',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec,e2e-spec}.{js,mjs,cjs,ts,mts,cts}'],
    reporters: ['default'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    env: {
      ...env,
      ...process.env,
      STEAM_ENCRYPTION_KEY:
        process.env.STEAM_ENCRYPTION_KEY?.trim() ||
        env.STEAM_ENCRYPTION_KEY?.trim() ||
        'e'.repeat(64),
    },
    coverage: {
      reportsDirectory: '../../coverage/apps/api-e2e',
      provider: 'v8' as const,
    },
  },
}));
