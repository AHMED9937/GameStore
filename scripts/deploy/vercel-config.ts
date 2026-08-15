/**
 * Vercel web deploy constants (DEPLOYMENT_PLAN.md D3) — official Nx + Vercel layout.
 *
 * Dashboard (must match; Root Directory empty is required for Nx):
 * - Root Directory: leave EMPTY (not apps/web, not .)
 * - Framework Preset: Next.js
 * - Build Command override: pnpm run vercel-build  (or leave to vercel.json)
 * - Output Directory override: apps/web/.next
 * - Install Command: pnpm install --frozen-lockfile
 *
 * @see https://nx.dev/docs/technologies/react/guides/deploy-nextjs-to-vercel
 */

export const VERCEL_ROOT_DIRECTORY = '';

export const VERCEL_FRAMEWORK = 'nextjs';

export const VERCEL_INSTALL_COMMAND = 'pnpm install --frozen-lockfile';

export const VERCEL_BUILD_SCRIPT = 'vercel-build';

export const VERCEL_OUTPUT_DIRECTORY = 'apps/web/.next';

/** Root package.json vercel-build — generate Prisma, next build in apps/web, verify+link .next */
export const VERCEL_BUILD_COMMAND =
  'pnpm db:generate && node node_modules/next/dist/bin/next build apps/web && node scripts/deploy/link-next-output.cjs';

/** Known Railway staging API (BFF upstream). */
export const STAGING_API_URL =
  'https://gamestore-production-4a06.up.railway.app';

export const NEXT_PUBLIC_API_URL = '/api';

export const CLERK_WEBHOOK_PATH = '/api/webhooks';

export const CLERK_WEBHOOK_EVENTS = [
  'user.created',
  'user.updated',
  'user.deleted',
] as const;

export const VERCEL_STAGING_ENV_KEYS = [
  'API_URL',
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_SITE_NAME',
  'NEXT_PUBLIC_DEFAULT_OG_IMAGE',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_PADDLE_ENV',
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
