import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';
import { loadEnv } from 'vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';

const workspaceRoot = resolve(__dirname, '../../..');
const env = loadEnv('test', workspaceRoot, '');

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../../node_modules/.vite/libs/api/prisma',
  plugins: [nxViteTsPaths(), nxCopyAssetsPlugin(['*.md'])],
  test: {
    name: 'api-prisma',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    testTimeout: 30_000,
    env: { ...env, ...process.env },
    coverage: {
      reportsDirectory: '../../../coverage/libs/api/prisma',
      provider: 'v8' as const,
    },
  },
}));
