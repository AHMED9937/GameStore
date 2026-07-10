import { D1_ENV_KEYS, type DeployEnvKey } from './env-keys';

export interface EnvCheck {
  key: string;
  ok: boolean;
  message: string;
}

export type DeployTarget = 'staging' | 'production';

export interface VerifyEnvOptions {
  target?: DeployTarget;
  /** Local STEAM_ENCRYPTION_KEY — staging key must differ when set */
  localSteamKey?: string;
}

const PLACEHOLDER_PATTERNS = [
  /postgresql:\/\/USER:PASSWORD@HOST/i,
  /^pk_test_\.\.\.$/,
  /^sk_test_\.\.\.$/,
  /^whsec_\.\.\.$/,
];

function isPlaceholder(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return true;
  }
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function requireNonEmpty(
  key: string,
  value: string | undefined,
  label: string,
): EnvCheck {
  if (!value?.trim() || isPlaceholder(value)) {
    return { key, ok: false, message: `${label} is missing or still a placeholder` };
  }
  return { key, ok: true, message: `${label} is set` };
}

export function checkDatabaseUrl(value: string | undefined): EnvCheck {
  const base = requireNonEmpty('DATABASE_URL', value, 'DATABASE_URL');
  if (!base.ok) {
    return base;
  }
  const url = value!.trim();
  if (!/^postgres(ql)?:\/\//i.test(url)) {
    return { key: 'DATABASE_URL', ok: false, message: 'DATABASE_URL must be a postgres URL' };
  }
  if (!/sslmode=require/i.test(url)) {
    return {
      key: 'DATABASE_URL',
      ok: false,
      message: 'DATABASE_URL should include sslmode=require for Neon',
    };
  }
  return { key: 'DATABASE_URL', ok: true, message: 'DATABASE_URL looks like a Neon postgres URL' };
}

export function checkDirectUrl(value: string | undefined): EnvCheck {
  const base = requireNonEmpty('DIRECT_URL', value, 'DIRECT_URL');
  if (!base.ok) {
    return base;
  }
  if (!/^postgres(ql)?:\/\//i.test(value!.trim())) {
    return { key: 'DIRECT_URL', ok: false, message: 'DIRECT_URL must be a postgres URL' };
  }
  return { key: 'DIRECT_URL', ok: true, message: 'DIRECT_URL is set' };
}

export function checkClerkPublishableKey(value: string | undefined): EnvCheck {
  const base = requireNonEmpty(
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    value,
    'Clerk publishable key',
  );
  if (!base.ok) {
    return base;
  }
  const key = value!.trim();
  if (!/^pk_(test|live)_/.test(key)) {
    return {
      key: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
      ok: false,
      message: 'Clerk publishable key should start with pk_test_ or pk_live_',
    };
  }
  return {
    key: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    ok: true,
    message: `Clerk publishable key present (${key.startsWith('pk_test_') ? 'test/dev' : 'live'})`,
  };
}

export function checkClerkSecretKey(value: string | undefined): EnvCheck {
  const base = requireNonEmpty('CLERK_SECRET_KEY', value, 'Clerk secret key');
  if (!base.ok) {
    return base;
  }
  const key = value!.trim();
  if (!/^sk_(test|live)_/.test(key)) {
    return {
      key: 'CLERK_SECRET_KEY',
      ok: false,
      message: 'Clerk secret key should start with sk_test_ or sk_live_',
    };
  }
  return {
    key: 'CLERK_SECRET_KEY',
    ok: true,
    message: `Clerk secret key present (${key.startsWith('sk_test_') ? 'test/dev' : 'live'})`,
  };
}

export function checkStripeSecretKey(
  value: string | undefined,
  target: DeployTarget = 'staging',
): EnvCheck {
  const base = requireNonEmpty('STRIPE_SECRET_KEY', value, 'Stripe secret key');
  if (!base.ok) {
    return base;
  }
  const key = value!.trim();
  if (target === 'staging' && key.startsWith('sk_live_')) {
    return {
      key: 'STRIPE_SECRET_KEY',
      ok: false,
      message: 'Staging must use Stripe Test mode (sk_test_…), not sk_live_',
    };
  }
  if (!/^sk_(test|live)_/.test(key)) {
    return {
      key: 'STRIPE_SECRET_KEY',
      ok: false,
      message: 'Stripe secret key should start with sk_test_ or sk_live_',
    };
  }
  return {
    key: 'STRIPE_SECRET_KEY',
    ok: true,
    message: `Stripe secret key present (${key.startsWith('sk_test_') ? 'test' : 'live'})`,
  };
}

export function checkStripePublishableKey(
  value: string | undefined,
  target: DeployTarget = 'staging',
): EnvCheck {
  const base = requireNonEmpty(
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    value,
    'Stripe publishable key',
  );
  if (!base.ok) {
    return base;
  }
  const key = value!.trim();
  if (target === 'staging' && key.startsWith('pk_live_')) {
    return {
      key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      ok: false,
      message: 'Staging must use Stripe Test mode (pk_test_…), not pk_live_',
    };
  }
  if (!/^pk_(test|live)_/.test(key)) {
    return {
      key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      ok: false,
      message: 'Stripe publishable key should start with pk_test_ or pk_live_',
    };
  }
  return {
    key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    ok: true,
    message: `Stripe publishable key present (${key.startsWith('pk_test_') ? 'test' : 'live'})`,
  };
}

export function checkIgdbClientId(value: string | undefined): EnvCheck {
  const base = requireNonEmpty('IGDB_CLIENT_ID', value, 'IGDB client id');
  if (!base.ok) {
    return base;
  }
  if (value!.trim().length < 4) {
    return { key: 'IGDB_CLIENT_ID', ok: false, message: 'IGDB_CLIENT_ID looks too short' };
  }
  return { key: 'IGDB_CLIENT_ID', ok: true, message: 'IGDB_CLIENT_ID is set' };
}

export function checkIgdbClientSecret(value: string | undefined): EnvCheck {
  const base = requireNonEmpty('IGDB_CLIENT_SECRET', value, 'IGDB client secret');
  if (!base.ok) {
    return base;
  }
  if (value!.trim().length < 8) {
    return {
      key: 'IGDB_CLIENT_SECRET',
      ok: false,
      message: 'IGDB_CLIENT_SECRET looks too short',
    };
  }
  return { key: 'IGDB_CLIENT_SECRET', ok: true, message: 'IGDB_CLIENT_SECRET is set' };
}

export function checkSteamEncryptionKey(
  value: string | undefined,
  localKey?: string,
): EnvCheck {
  const base = requireNonEmpty('STEAM_ENCRYPTION_KEY', value, 'STEAM_ENCRYPTION_KEY');
  if (!base.ok) {
    return base;
  }
  const key = value!.trim();
  const isHex64 = /^[0-9a-fA-F]{64}$/.test(key);
  const isLongSecret = key.length >= 32;
  if (!isHex64 && !isLongSecret) {
    return {
      key: 'STEAM_ENCRYPTION_KEY',
      ok: false,
      message: 'STEAM_ENCRYPTION_KEY must be 64-char hex or a 32+ character secret',
    };
  }
  if (localKey?.trim() && key === localKey.trim()) {
    return {
      key: 'STEAM_ENCRYPTION_KEY',
      ok: false,
      message: 'STEAM_ENCRYPTION_KEY must differ from your local .env value',
    };
  }
  return {
    key: 'STEAM_ENCRYPTION_KEY',
    ok: true,
    message: isHex64
      ? 'STEAM_ENCRYPTION_KEY is 64-char hex (staging-unique)'
      : 'STEAM_ENCRYPTION_KEY is set (32+ chars)',
  };
}

const D1_CHECKERS: Record<
  string,
  (env: Record<string, string | undefined>, options: VerifyEnvOptions) => EnvCheck
> = {
  DATABASE_URL: (env) => checkDatabaseUrl(env.DATABASE_URL),
  DIRECT_URL: (env) => checkDirectUrl(env.DIRECT_URL),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: (env) =>
    checkClerkPublishableKey(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY),
  CLERK_SECRET_KEY: (env) => checkClerkSecretKey(env.CLERK_SECRET_KEY),
  STRIPE_SECRET_KEY: (env, opts) =>
    checkStripeSecretKey(env.STRIPE_SECRET_KEY, opts.target ?? 'staging'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: (env, opts) =>
    checkStripePublishableKey(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, opts.target ?? 'staging'),
  IGDB_CLIENT_ID: (env) => checkIgdbClientId(env.IGDB_CLIENT_ID),
  IGDB_CLIENT_SECRET: (env) => checkIgdbClientSecret(env.IGDB_CLIENT_SECRET),
  STEAM_ENCRYPTION_KEY: (env, opts) =>
    checkSteamEncryptionKey(env.STEAM_ENCRYPTION_KEY, opts.localSteamKey),
};

/** Run all D1 mandatory checks against a flat env map. */
export function verifyD1Env(
  env: Record<string, string | undefined>,
  options: VerifyEnvOptions = {},
): { checks: EnvCheck[]; passed: boolean } {
  const checks: EnvCheck[] = [];

  for (const keyDef of D1_ENV_KEYS) {
    const run = D1_CHECKERS[keyDef.name];
    checks.push(run ? run(env, options) : requireNonEmpty(keyDef.name, env[keyDef.name], keyDef.name));
  }

  return {
    checks,
    passed: checks.every((c) => c.ok),
  };
}

/** Parse .env-style file content into a flat map (no expansion). */
export function parseEnvFile(content: string): Record<string, string> {
  const env: Record<string, string> = {};

  for (const line of content.split(/\r?\n/)) {
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
    env[key] = value;
  }

  return env;
}

/** Ensure .env.example documents every key from the canonical list. */
export function findMissingEnvExampleKeys(
  envExampleContent: string,
  keys: DeployEnvKey[],
): string[] {
  const documented = new Set(Object.keys(parseEnvFile(envExampleContent)));
  const missing: string[] = [];

  for (const { name } of keys) {
    if (!documented.has(name) && !envExampleContent.includes(`${name}=`)) {
      missing.push(name);
    }
  }

  return missing;
}
