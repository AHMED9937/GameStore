import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildBffGamesUrl,
  buildClerkWebhookUrl,
  buildSiteUrl,
  CLERK_WEBHOOK_EVENTS,
  CLERK_WEBHOOK_PATH,
  NEXT_PUBLIC_API_URL,
  STAGING_API_URL,
  VERCEL_BUILD_COMMAND,
  VERCEL_BUILD_SCRIPT,
  VERCEL_FRAMEWORK,
  VERCEL_INSTALL_COMMAND,
  VERCEL_OUTPUT_DIRECTORY,
  VERCEL_ROOT_DIRECTORY,
  VERCEL_STAGING_ENV_KEYS,
} from './vercel-config';

const ROOT = join(__dirname, '../..');
const VERCEL_JSON = JSON.parse(
  readFileSync(join(ROOT, 'vercel.json'), 'utf8'),
) as {
  framework?: string;
  installCommand?: string;
  buildCommand?: string;
  outputDirectory?: string;
};
const PACKAGE_JSON = JSON.parse(
  readFileSync(join(ROOT, 'package.json'), 'utf8'),
) as { scripts?: Record<string, string> };
const LINK_SCRIPT = readFileSync(
  join(ROOT, 'scripts/deploy/link-next-output.cjs'),
  'utf8',
);

describe('vercel.json (Nx + Vercel official layout)', () => {
  it('uses empty Root Directory semantics with apps/web/.next output', () => {
    expect(VERCEL_ROOT_DIRECTORY).toBe('');
    expect(VERCEL_JSON.framework).toBe(VERCEL_FRAMEWORK);
    expect(VERCEL_JSON.installCommand).toBe(VERCEL_INSTALL_COMMAND);
    expect(VERCEL_JSON.buildCommand).toBe(`pnpm run ${VERCEL_BUILD_SCRIPT}`);
    expect(VERCEL_JSON.outputDirectory).toBe(VERCEL_OUTPUT_DIRECTORY);
    expect(VERCEL_OUTPUT_DIRECTORY).toBe('apps/web/.next');
  });

  it('builds Prisma then Next then verifies routes-manifest', () => {
    expect(PACKAGE_JSON.scripts?.[VERCEL_BUILD_SCRIPT]).toBe(VERCEL_BUILD_COMMAND);
    expect(VERCEL_BUILD_COMMAND).toContain('pnpm db:generate');
    expect(VERCEL_BUILD_COMMAND).toContain('apps/web');
    expect(VERCEL_BUILD_COMMAND).toContain('next build');
    expect(VERCEL_BUILD_COMMAND).toContain('link-next-output.cjs');
    const generateAt = VERCEL_BUILD_COMMAND.indexOf('pnpm db:generate');
    const nextAt = VERCEL_BUILD_COMMAND.indexOf('next build');
    const linkAt = VERCEL_BUILD_COMMAND.indexOf('link-next-output.cjs');
    expect(generateAt).toBeGreaterThanOrEqual(0);
    expect(nextAt).toBeGreaterThan(generateAt);
    expect(linkAt).toBeGreaterThan(nextAt);
  });

  it('link script requires routes-manifest.json before succeeding', () => {
    expect(LINK_SCRIPT).toContain('routes-manifest.json');
    expect(LINK_SCRIPT).toContain('apps/web/.next');
    expect(LINK_SCRIPT).toContain('symlinkSync');
  });
});

describe('Vercel staging constants (D3)', () => {
  it('points BFF at known Railway staging API', () => {
    expect(STAGING_API_URL).toBe(
      'https://gamestore-production-4a06.up.railway.app',
    );
    expect(NEXT_PUBLIC_API_URL).toBe('/api');
  });

  it('documents required Vercel env keys including Clerk webhook', () => {
    expect(VERCEL_STAGING_ENV_KEYS).toContain('API_URL');
    expect(VERCEL_STAGING_ENV_KEYS).toContain('DATABASE_URL');
    expect(VERCEL_STAGING_ENV_KEYS).toContain('CLERK_WEBHOOK_SECRET');
  });

  it('builds Clerk webhook and BFF smoke URLs', () => {
    const web = 'https://gamestore.vercel.app';
    expect(buildClerkWebhookUrl(web)).toBe(
      `https://gamestore.vercel.app${CLERK_WEBHOOK_PATH}`,
    );
    expect(buildBffGamesUrl(web)).toBe('https://gamestore.vercel.app/api/games');
  });

  it('lists Clerk user sync webhook events', () => {
    expect(CLERK_WEBHOOK_EVENTS).toContain('user.created');
    expect(CLERK_WEBHOOK_EVENTS).toContain('user.updated');
    expect(CLERK_WEBHOOK_EVENTS).toContain('user.deleted');
  });
});
