/**
 * Vercel staging web deploy constants (DEPLOYMENT_PLAN.md D3).
 * Keep in sync with root vercel.json + package.json vercel-build — tests assert that.
 */

export const VERCEL_INSTALL_COMMAND = 'pnpm install --frozen-lockfile';

export const VERCEL_BUILD_SCRIPT = 'vercel-build';

/** Next writes under apps/web; root Vercel project must point here. */
export const VERCEL_OUTPUT_DIRECTORY = 'apps/web/.next';

/** Root package.json script body — prisma generate before Next (Clerk webhook uses Prisma). */
export const VERCEL_BUILD_COMMAND =
  'pnpm db:generate && cd apps/web && node ../../node_modules/next/dist/bin/next build';

/** Known Railway staging API (BFF upstream). */
export const STAGING_API_URL =
  'https://gamestore-production-4a06.up.railway.app';

export const NEXT_PUBLIC_API_URL = '/api';

/** Clerk webhook route on Next (not Railway). */
export const CLERK_WEBHOOK_PATH = '/api/webhooks';

export const CLERK_WEBHOOK_EVENTS = [
  'user.created',
  'user.updated',
  'user.deleted',
] as const;

/** Env vars that must be set on the Vercel web project for staging. */
export const VERCEL_STAGING_ENV_KEYS = [
  'API_URL',
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_SITE_NAME',
  'NEXT_PUBLIC_DEFAULT_OG_IMAGE',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'DATABASE_URL',
  'DIRECT_URL',
  'CLERK_WEBHOOK_SECRET',
] as const;

export function buildClerkWebhookUrl(webBaseUrl: string): string {
  const base = webBaseUrl.replace(/\/$/, '');
  return `${base}${CLERK_WEBHOOK_PATH}`;
}

export function buildSiteUrl(webBaseUrl: string, path = '/'): string {
  const base = webBaseUrl.replace(/\/$/, '');
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized === '/' ? '/' : normalized}`;
}

export function buildBffGamesUrl(webBaseUrl: string): string {
  const base = webBaseUrl.replace(/\/$/, '');
  return `${base}/api/games`;
}
