import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildGamesUrl,
  buildHealthUrl,
  buildStripeWebhookUrl,
  RAILWAY_BUILD_COMMAND,
  RAILWAY_HEALTHCHECK_PATH,
  RAILWAY_RELEASE_COMMAND,
  RAILWAY_STAGING_ENV_KEYS,
  RAILWAY_START_COMMAND,
  STRIPE_WEBHOOK_EVENTS,
  STRIPE_WEBHOOK_PATH,
} from './railway-config';

const ROOT = join(__dirname, '../..');
const RAILWAY_TOML = readFileSync(join(ROOT, 'railway.toml'), 'utf8');
const NIXPACKS_TOML = readFileSync(join(ROOT, 'nixpacks.toml'), 'utf8');
const NX_JSON = readFileSync(join(ROOT, 'nx.json'), 'utf8');

describe('railway.toml (D2)', () => {
  it('builds Nest API without migrate in the image build step', () => {
    expect(RAILWAY_TOML).toContain(RAILWAY_BUILD_COMMAND);
    expect(RAILWAY_BUILD_COMMAND).toContain('pnpm nx build api');
    expect(RAILWAY_BUILD_COMMAND).not.toContain('db:migrate');
    expect(RAILWAY_BUILD_COMMAND).toContain('NX_DAEMON=false');
    expect(RAILWAY_BUILD_COMMAND).toContain('NX_PARALLEL=1');
    expect(RAILWAY_BUILD_COMMAND).toContain('--parallel=1');
    expect(RAILWAY_BUILD_COMMAND).toContain('max-old-space-size=3072');
    const generateAt = RAILWAY_BUILD_COMMAND.indexOf('pnpm db:generate');
    const buildAt = RAILWAY_BUILD_COMMAND.indexOf('pnpm nx build api');
    expect(generateAt).toBeGreaterThanOrEqual(0);
    expect(buildAt).toBeGreaterThan(generateAt);
  });

  it('runs prisma migrate as releaseCommand before start', () => {
    expect(RAILWAY_TOML).toContain(`releaseCommand = "${RAILWAY_RELEASE_COMMAND}"`);
    expect(RAILWAY_RELEASE_COMMAND).toBe('pnpm db:migrate');
  });

  it('starts Nest from webpack output path', () => {
    expect(RAILWAY_TOML).toContain(RAILWAY_START_COMMAND);
    expect(RAILWAY_START_COMMAND).toBe('node dist/apps/api/main.js');
  });

  it('healthchecks the DB endpoint Nest exposes', () => {
    expect(RAILWAY_TOML).toContain(`healthcheckPath = "${RAILWAY_HEALTHCHECK_PATH}"`);
    expect(RAILWAY_HEALTHCHECK_PATH).toBe('/api/health/db');
  });
});

describe('nixpacks.toml (D2)', () => {
  it('pins Node 20 and forces the node provider (not Next)', () => {
    expect(NIXPACKS_TOML).toContain('NIXPACKS_NODE_VERSION = "20"');
    expect(NIXPACKS_TOML).toContain('providers = ["node"]');
    expect(NIXPACKS_TOML).toContain('NX_DAEMON = "false"');
    expect(NIXPACKS_TOML).toContain('NX_PARALLEL = "1"');
  });
});

describe('nx.json Railway-safe project graph', () => {
  it('does not load @nx/playwright/plugin (breaks graph on .mts/.ts load in CI)', () => {
    expect(NX_JSON).not.toContain('@nx/playwright/plugin');
  });
});

describe('Railway staging URLs + Stripe webhook (D2)', () => {
  const api = 'https://api-staging.up.railway.app';

  it('builds health and games smoke URLs', () => {
    expect(buildHealthUrl(api)).toBe('https://api-staging.up.railway.app/api/health/db');
    expect(buildGamesUrl(`${api}/`)).toBe('https://api-staging.up.railway.app/api/games');
  });

  it('builds Stripe webhook URL that bypasses the Next BFF', () => {
    expect(buildStripeWebhookUrl(api)).toBe(
      `https://api-staging.up.railway.app${STRIPE_WEBHOOK_PATH}`,
    );
    expect(STRIPE_WEBHOOK_PATH).toBe('/api/payments/webhook');
  });

  it('lists Nest-handled Stripe events for the Dashboard webhook', () => {
    expect(STRIPE_WEBHOOK_EVENTS).toContain('checkout.session.completed');
    expect(STRIPE_WEBHOOK_EVENTS).toContain('invoice.paid');
    expect(STRIPE_WEBHOOK_EVENTS).toContain('customer.subscription.deleted');
  });

  it('documents required Railway env keys including webhook secret', () => {
    expect(RAILWAY_STAGING_ENV_KEYS).toContain('STRIPE_WEBHOOK_SECRET');
    expect(RAILWAY_STAGING_ENV_KEYS).toContain('CORS_ORIGINS');
    expect(RAILWAY_STAGING_ENV_KEYS).toContain('STEAM_ENCRYPTION_KEY');
    expect(RAILWAY_STAGING_ENV_KEYS).toContain('NEXT_PUBLIC_SITE_URL');
  });
});
