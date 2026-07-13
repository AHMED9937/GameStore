import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildGamesUrl,
  buildHealthUrl,
  buildStripeWebhookUrl,
  RAILWAY_BUILD_COMMAND,
  RAILWAY_HEALTHCHECK_PATH,
  RAILWAY_STAGING_ENV_KEYS,
  RAILWAY_START_COMMAND,
  STRIPE_WEBHOOK_EVENTS,
  STRIPE_WEBHOOK_PATH,
} from './railway-config';

const ROOT = join(__dirname, '../..');
const RAILWAY_TOML = readFileSync(join(ROOT, 'railway.toml'), 'utf8');
const NIXPACKS_TOML = readFileSync(join(ROOT, 'nixpacks.toml'), 'utf8');

describe('railway.toml (D2)', () => {
  it('uses monorepo build: install, nx build api, migrate', () => {
    expect(RAILWAY_TOML).toContain(RAILWAY_BUILD_COMMAND);
    expect(RAILWAY_BUILD_COMMAND).toContain('pnpm nx build api');
    expect(RAILWAY_BUILD_COMMAND).toContain('pnpm db:migrate');
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
  it('pins Node 20 for Railway builds', () => {
    expect(NIXPACKS_TOML).toContain('NIXPACKS_NODE_VERSION = "20"');
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
  });
});
