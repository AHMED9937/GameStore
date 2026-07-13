/**
 * Canonical deployment env keys (DEPLOYMENT_PLAN.md §7).
 * Values live in host secret stores — never commit real secrets.
 */

export type DeployHost = 'vercel' | 'railway' | 'both' | 'local-only';

export interface DeployEnvKey {
  /** Variable name as used in .env / host dashboards */
  name: string;
  /** Where the key is required in cloud deploys */
  host: DeployHost;
  /** Shown in verify-env output */
  description: string;
  /** Required for D1 staging provisioning gate */
  d1Required: boolean;
}

/** Keys required before staging deploy (D1 exit). */
export const D1_ENV_KEYS: DeployEnvKey[] = [
  {
    name: 'DATABASE_URL',
    host: 'both',
    description: 'Neon pooled connection (runtime)',
    d1Required: true,
  },
  {
    name: 'DIRECT_URL',
    host: 'both',
    description: 'Neon direct connection (Prisma migrations)',
    d1Required: true,
  },
  {
    name: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    host: 'vercel',
    description: 'Clerk publishable key (staging instance)',
    d1Required: true,
  },
  {
    name: 'CLERK_SECRET_KEY',
    host: 'both',
    description: 'Clerk secret key (JWT verify on API; server on web)',
    d1Required: true,
  },
  {
    name: 'STRIPE_SECRET_KEY',
    host: 'railway',
    description: 'Stripe secret (Test mode for staging)',
    d1Required: true,
  },
  {
    name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    host: 'vercel',
    description: 'Stripe publishable (Test mode for staging)',
    d1Required: true,
  },
  {
    name: 'IGDB_CLIENT_ID',
    host: 'railway',
    description: 'Twitch / IGDB app client id',
    d1Required: true,
  },
  {
    name: 'IGDB_CLIENT_SECRET',
    host: 'railway',
    description: 'Twitch / IGDB app client secret',
    d1Required: true,
  },
  {
    name: 'STEAM_ENCRYPTION_KEY',
    host: 'railway',
    description: 'Staging-unique 64-char hex (or 32+ char secret)',
    d1Required: true,
  },
];

/** Keys set in later slices — documented in .env.example but not D1-gated. */
export const LATER_DEPLOY_ENV_KEYS: DeployEnvKey[] = [
  {
    name: 'STRIPE_WEBHOOK_SECRET',
    host: 'railway',
    description: 'Stripe webhook signing secret (D2 — after Railway URL)',
    d1Required: false,
  },
  {
    name: 'CLERK_WEBHOOK_SECRET',
    host: 'vercel',
    description: 'Clerk webhook signing secret (D3 — after Vercel URL)',
    d1Required: false,
  },
  {
    name: 'CLERK_WEBHOOK_SIGNING_SECRET',
    host: 'vercel',
    description: 'Alternate name for Clerk webhook secret',
    d1Required: false,
  },
  {
    name: 'CORS_ORIGINS',
    host: 'railway',
    description: 'Comma-separated browser origins (finalize in D3)',
    d1Required: false,
  },
  {
    name: 'API_URL',
    host: 'vercel',
    description: 'Railway Nest HTTPS URL (BFF upstream)',
    d1Required: false,
  },
  {
    name: 'NEXT_PUBLIC_API_URL',
    host: 'vercel',
    description: 'Browser API base (/api BFF in production)',
    d1Required: false,
  },
  {
    name: 'NEXT_PUBLIC_SITE_URL',
    host: 'both',
    description:
      'Public site URL (https://offlinegamenia.com). Required on Railway for Stripe redirects; Vercel for SEO',
    d1Required: false,
  },
  {
    name: 'SITE_URL',
    host: 'railway',
    description: 'Optional Nest alias for NEXT_PUBLIC_SITE_URL (preferred if both set)',
    d1Required: false,
  },
  {
    name: 'NEXT_PUBLIC_SITE_NAME',
    host: 'vercel',
    description: 'Brand name for SEO / OG',
    d1Required: false,
  },
  {
    name: 'NEXT_PUBLIC_DEFAULT_OG_IMAGE',
    host: 'vercel',
    description: 'Default Open Graph image path',
    d1Required: false,
  },
  {
    name: 'NODE_ENV',
    host: 'both',
    description: 'production on Vercel / Railway',
    d1Required: false,
  },
  {
    name: 'PORT',
    host: 'railway',
    description: 'Injected by Railway — do not hardcode',
    d1Required: false,
  },
  {
    name: 'SENTRY_DSN',
    host: 'both',
    description: 'Error tracking (D9)',
    d1Required: false,
  },
  {
    name: 'NEXT_PUBLIC_SENTRY_DSN',
    host: 'vercel',
    description: 'Sentry browser DSN (D9)',
    d1Required: false,
  },
];

export const ALL_DOCUMENTED_ENV_KEYS: DeployEnvKey[] = [
  ...D1_ENV_KEYS,
  ...LATER_DEPLOY_ENV_KEYS,
];

export function keysForHost(host: DeployHost): DeployEnvKey[] {
  return ALL_DOCUMENTED_ENV_KEYS.filter(
    (k) => k.host === host || k.host === 'both',
  );
}
