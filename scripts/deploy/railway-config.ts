/**
 * Railway staging API deploy constants (DEPLOYMENT_PLAN.md D2).
 * Keep in sync with railway.toml — tests assert that file matches these values.
 */

export const RAILWAY_BUILD_COMMAND =
  'pnpm install --frozen-lockfile && pnpm db:generate && NX_DAEMON=false NX_PARALLEL=1 NX_TUI=false NODE_OPTIONS=--max-old-space-size=3072 pnpm nx build api --parallel=1';

export const RAILWAY_RELEASE_COMMAND = 'pnpm db:migrate';

/** Migrate must run before Nest listens so schema/code never drift again. */
export const RAILWAY_START_COMMAND = 'pnpm db:migrate && node dist/apps/api/main.js';

export const RAILWAY_HEALTHCHECK_PATH = '/api/health/db';

/** Nest global prefix + controller path for Paddle notifications (hit Railway directly). */
export const PADDLE_WEBHOOK_PATH = '/api/payments/webhook';

/** Paddle Dashboard → Notifications → events Nest handles. */
export const PADDLE_WEBHOOK_EVENTS = [
  'transaction.completed',
  'transaction.paid',
  'transaction.canceled',
  'transaction.past_due',
  'subscription.activated',
  'subscription.created',
  'subscription.updated',
  'subscription.canceled',
  'subscription.past_due',
  'subscription.paused',
  'subscription.resumed',
] as const;

/** Env vars that must be set on the Railway API service for staging. */
export const RAILWAY_STAGING_ENV_KEYS = [
  'NODE_ENV',
  'DATABASE_URL',
  'DIRECT_URL',
  'CORS_ORIGINS',
  'CLERK_SECRET_KEY',
  'PADDLE_API_KEY',
  'PADDLE_NOTIFICATION_WEBHOOK_SECRET',
  'STEAM_ENCRYPTION_KEY',
  'IGDB_CLIENT_ID',
  'IGDB_CLIENT_SECRET',
  'NEXT_PUBLIC_SITE_URL',
  'DISCORD_NEW_GAMES_WEBHOOK_URL',
] as const;

export function buildPaddleWebhookUrl(apiBaseUrl: string): string {
  const base = apiBaseUrl.replace(/\/$/, '');
  return `${base}${PADDLE_WEBHOOK_PATH}`;
}

export function buildHealthUrl(apiBaseUrl: string): string {
  const base = apiBaseUrl.replace(/\/$/, '');
  return `${base}${RAILWAY_HEALTHCHECK_PATH}`;
}

export function buildGamesUrl(apiBaseUrl: string): string {
  const base = apiBaseUrl.replace(/\/$/, '');
  return `${base}/api/games`;
}
