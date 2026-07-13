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
  VERCEL_BUILD_COMMAND_IN_APP,
  VERCEL_BUILD_SCRIPT,
  VERCEL_INSTALL_COMMAND,
  VERCEL_ROOT_DIRECTORY,
  VERCEL_STAGING_ENV_KEYS,
} from './vercel-config';

const ROOT = join(__dirname, '../..');
const WEB_VERCEL_JSON = JSON.parse(
  readFileSync(join(ROOT, 'apps/web/vercel.json'), 'utf8'),
) as {
  framework?: string;
  installCommand?: string;
  buildCommand?: string;
  outputDirectory?: string;
};
const NEXT_CONFIG = readFileSync(
  join(ROOT, 'apps/web/next.config.js'),
  'utf8',
);
const PACKAGE_JSON = JSON.parse(
  readFileSync(join(ROOT, 'package.json'), 'utf8'),
) as { scripts?: Record<string, string> };

describe('apps/web/vercel.json + vercel-build (D3)', () => {
  it('targets apps/web as Vercel Root Directory with monorepo install/build', () => {
    expect(VERCEL_ROOT_DIRECTORY).toBe('apps/web');
    expect(WEB_VERCEL_JSON.framework).toBe('nextjs');
    expect(WEB_VERCEL_JSON.installCommand).toBe(VERCEL_INSTALL_COMMAND);
    expect(WEB_VERCEL_JSON.buildCommand).toBe(VERCEL_BUILD_COMMAND_IN_APP);
    // Next.js builder looks for .next under Root Directory — never override.
    expect(WEB_VERCEL_JSON.outputDirectory).toBeUndefined();
  });

  it('keeps default distDir so .next lands in apps/web', () => {
    expect(NEXT_CONFIG).not.toContain('distDir');
  });

  it('generates Prisma client before Next build', () => {
    expect(PACKAGE_JSON.scripts?.[VERCEL_BUILD_SCRIPT]).toBe(VERCEL_BUILD_COMMAND);
    expect(VERCEL_BUILD_COMMAND).toContain('pnpm db:generate');
    expect(VERCEL_BUILD_COMMAND).toContain('apps/web');
    expect(VERCEL_BUILD_COMMAND).toContain('next build');
    const generateAt = VERCEL_BUILD_COMMAND.indexOf('pnpm db:generate');
    const nextAt = VERCEL_BUILD_COMMAND.indexOf('next build');
    expect(generateAt).toBeGreaterThanOrEqual(0);
    expect(nextAt).toBeGreaterThan(generateAt);
  });
});

describe('Vercel staging constants (D3)', () => {
  it('points BFF at known Railway staging API', () => {
    expect(STAGING_API_URL).toBe(
      'https://gamestore-production-4a06.up.railway.app',
    );
    expect(STAGING_API_URL).toMatch(/^https:\/\//);
    expect(NEXT_PUBLIC_API_URL).toBe('/api');
  });

  it('documents required Vercel env keys including Clerk webhook', () => {
    expect(VERCEL_STAGING_ENV_KEYS).toContain('API_URL');
    expect(VERCEL_STAGING_ENV_KEYS).toContain('DATABASE_URL');
    expect(VERCEL_STAGING_ENV_KEYS).toContain('CLERK_WEBHOOK_SECRET');
    expect(VERCEL_STAGING_ENV_KEYS).toContain('NEXT_PUBLIC_SITE_URL');
  });

  it('builds Clerk webhook and BFF smoke URLs', () => {
    const web = 'https://gamestore.vercel.app';
    expect(buildClerkWebhookUrl(web)).toBe(
      `https://gamestore.vercel.app${CLERK_WEBHOOK_PATH}`,
    );
    expect(CLERK_WEBHOOK_PATH).toBe('/api/webhooks');
    expect(buildSiteUrl(web)).toBe('https://gamestore.vercel.app/');
    expect(buildSiteUrl(`${web}/`, '/robots.txt')).toBe(
      'https://gamestore.vercel.app/robots.txt',
    );
    expect(buildBffGamesUrl(web)).toBe('https://gamestore.vercel.app/api/games');
  });

  it('lists Clerk user sync webhook events', () => {
    expect(CLERK_WEBHOOK_EVENTS).toContain('user.created');
    expect(CLERK_WEBHOOK_EVENTS).toContain('user.updated');
    expect(CLERK_WEBHOOK_EVENTS).toContain('user.deleted');
  });
});
