import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, devices } from '@playwright/test';
import { loadEnv } from 'vite';

const workspaceRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);

for (const [key, value] of Object.entries(loadEnv('', workspaceRoot, ''))) {
  if (process.env[key] === undefined) {
    process.env[key] = value;
  }
}

const baseURL = process.env['BASE_URL'] || 'http://localhost:4200';
const skipWebServer = process.env['E2E_SKIP_WEBSERVER'] === '1';
const hasDatabase = Boolean(process.env['DATABASE_URL']);
const serverEnv = Object.fromEntries(
  Object.entries(process.env).filter(
    (entry): entry is [string, string] => entry[1] !== undefined,
  ),
);

export default defineConfig({
  testDir: './src',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  ...(skipWebServer
    ? {}
    : {
        webServer: hasDatabase
          ? {
              command: 'node apps/web-e2e/scripts/start-stack.mjs',
              cwd: workspaceRoot,
              url: baseURL,
              reuseExistingServer: !process.env['CI'],
              timeout: 240_000,
              env: serverEnv,
            }
          : {
              command: 'pnpm nx start web -- --port 4200',
              cwd: workspaceRoot,
              url: baseURL,
              reuseExistingServer: !process.env['CI'],
              timeout: 120_000,
              env: {
                ...serverEnv,
                API_URL: process.env['API_URL'] ?? 'http://localhost:3333',
              },
            },
      }),
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
