/**
 * Railway staging API deploy constants (DEPLOYMENT_PLAN.md D2).
 * Keep in sync with railway.toml — tests assert that file matches these values.
 */

export const RAILWAY_BUILD_COMMAND =
  'pnpm install --frozen-lockfile && NX_DAEMON=false pnpm nx build api';

export const RAILWAY_RELEASE_COMMAND = 'pnpm db:migrate';

export const RAILWAY_START_COMMAND = 'node dist/apps/api/main.js';

export const RAILWAY_HEALTHCHECK_PATH = '/api/health/db';

/** Nest global prefix + controller path for Stripe webhooks (hit Railway directly). */
export const STRIPE_WEBHOOK_PATH = '/api/payments/webhook';

/** Stripe Dashboard → Webhooks → events Nest handles. */
export const STRIPE_WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed',
  'checkout.session.expired',
  'invoice.paid',
  'customer.subscription.updated',
  'customer.subscription.deleted',
] as const;

/** Env vars that must be set on the Railway API service for staging. */
export const RAILWAY_STAGING_ENV_KEYS = [
  'NODE_ENV',
  'DATABASE_URL',
  'DIRECT_URL',
  'CORS_ORIGINS',
  'CLERK_SECRET_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STEAM_ENCRYPTION_KEY',
  'IGDB_CLIENT_ID',
  'IGDB_CLIENT_SECRET',
] as const;

export function buildStripeWebhookUrl(apiBaseUrl: string): string {
  const base = apiBaseUrl.replace(/\/$/, '');
  return `${base}${STRIPE_WEBHOOK_PATH}`;
}

export function buildHealthUrl(apiBaseUrl: string): string {
  const base = apiBaseUrl.replace(/\/$/, '');
  return `${base}${RAILWAY_HEALTHCHECK_PATH}`;
}

export function buildGamesUrl(apiBaseUrl: string): string {
  const base = apiBaseUrl.replace(/\/$/, '');
  return `${base}/api/games`;
}
