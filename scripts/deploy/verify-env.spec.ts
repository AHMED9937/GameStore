import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ALL_DOCUMENTED_ENV_KEYS, D1_ENV_KEYS, keysForHost } from './env-keys';
import {
  checkClerkPublishableKey,
  checkClerkSecretKey,
  checkDatabaseUrl,
  checkIgdbClientId,
  checkIgdbClientSecret,
  checkSteamEncryptionKey,
  checkStripePublishableKey,
  checkStripeSecretKey,
  findMissingEnvExampleKeys,
  parseEnvFile,
  verifyD1Env,
} from './verify-env';

const ROOT = join(__dirname, '../..');
const ENV_EXAMPLE = readFileSync(join(ROOT, '.env.example'), 'utf8');
const ENV_STAGING_EXAMPLE = readFileSync(join(ROOT, '.env.staging.example'), 'utf8');

const STAGING_FIXTURE: Record<string, string> = {
  DATABASE_URL:
    'postgresql://user:pass@ep-staging.us-east-2.aws.neon.tech/neondb?sslmode=require',
  DIRECT_URL:
    'postgresql://user:pass@ep-staging.us-east-2.aws.neon.tech/neondb?sslmode=require',
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_staging_example',
  CLERK_SECRET_KEY: 'sk_test_staging_example',
  STRIPE_SECRET_KEY: 'sk_test_staging_example',
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_staging_example',
  IGDB_CLIENT_ID: 'twitch_client_id',
  IGDB_CLIENT_SECRET: 'twitch_client_secret_value',
  STEAM_ENCRYPTION_KEY: 'a'.repeat(64),
};

describe('deploy env-keys', () => {
  it('lists every D1 key in the canonical registry', () => {
    expect(D1_ENV_KEYS.length).toBe(9);
    expect(D1_ENV_KEYS.every((k) => k.d1Required)).toBe(true);
  });

  it('assigns Railway-only secrets to railway host', () => {
    const railwayOnly = ['STRIPE_SECRET_KEY', 'IGDB_CLIENT_ID', 'STEAM_ENCRYPTION_KEY'];
    for (const name of railwayOnly) {
      const entry = ALL_DOCUMENTED_ENV_KEYS.find((k) => k.name === name);
      expect(entry?.host).toBe('railway');
    }
  });

  it('assigns browser-safe keys to vercel host', () => {
    const vercelKeys = keysForHost('vercel').map((k) => k.name);
    expect(vercelKeys).toContain('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
    expect(vercelKeys).toContain('API_URL');
    expect(vercelKeys).not.toContain('STRIPE_SECRET_KEY');
  });
});

describe('verify-env format checks', () => {
  it('accepts a valid Neon DATABASE_URL', () => {
    expect(checkDatabaseUrl(STAGING_FIXTURE.DATABASE_URL).ok).toBe(true);
  });

  it('rejects postgres URL without sslmode=require', () => {
    const result = checkDatabaseUrl('postgresql://u:p@host/db');
    expect(result.ok).toBe(false);
    expect(result.message).toContain('sslmode=require');
  });

  it('requires Clerk keys with pk_/sk_ prefixes', () => {
    expect(checkClerkPublishableKey('pk_test_abc').ok).toBe(true);
    expect(checkClerkSecretKey('sk_test_abc').ok).toBe(true);
    expect(checkClerkPublishableKey('invalid').ok).toBe(false);
  });

  it('requires Stripe Test keys for staging', () => {
    expect(checkStripeSecretKey('sk_test_abc', 'staging').ok).toBe(true);
    expect(checkStripeSecretKey('sk_live_abc', 'staging').ok).toBe(false);
    expect(checkStripePublishableKey('pk_live_abc', 'staging').ok).toBe(false);
  });

  it('validates IGDB credentials are non-trivial', () => {
    expect(checkIgdbClientId('abcd').ok).toBe(true);
    expect(checkIgdbClientSecret('short').ok).toBe(false);
  });

  it('requires staging Steam key to differ from local', () => {
    const key = 'b'.repeat(64);
    expect(checkSteamEncryptionKey(key, 'a'.repeat(64)).ok).toBe(true);
    expect(checkSteamEncryptionKey(key, key).ok).toBe(false);
  });

  it('passes full D1 fixture when staging keys are valid', () => {
    const { passed, checks } = verifyD1Env(STAGING_FIXTURE, {
      target: 'staging',
      localSteamKey: 'c'.repeat(64),
    });
    expect(checks.filter((c) => !c.ok)).toEqual([]);
    expect(passed).toBe(true);
  });
});

describe('.env.staging.example (D1 staging)', () => {
  it('documents all D1 required keys', () => {
    const missing = findMissingEnvExampleKeys(ENV_STAGING_EXAMPLE, D1_ENV_KEYS);
    expect(missing).toEqual([]);
  });

  it('reminds to use Neon staging branch not main', () => {
    expect(ENV_STAGING_EXAMPLE).toMatch(/staging branch/i);
    expect(ENV_STAGING_EXAMPLE).toMatch(/NOT main/i);
  });
});

describe('.env.example completeness (D1)', () => {
  it('documents every deploy env key', () => {
    const missing = findMissingEnvExampleKeys(ENV_EXAMPLE, ALL_DOCUMENTED_ENV_KEYS);
    expect(missing).toEqual([]);
  });

  it('parses .env.example without throwing', () => {
    const parsed = parseEnvFile(ENV_EXAMPLE);
    expect(parsed.DATABASE_URL).toBeDefined();
    expect(parsed.CLERK_SECRET_KEY).toBeDefined();
  });
});
