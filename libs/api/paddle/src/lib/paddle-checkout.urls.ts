const DEV_FALLBACK_SITE_URL = 'http://localhost:3000';

function isLocalhostUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return /localhost|127\.0\.0\.1/i.test(url);
  }
}

/**
 * Public storefront origin for Paddle redirects, Discord links, etc.
 * Order: explicit arg → SITE_URL → NEXT_PUBLIC_SITE_URL → localhost (non-production only).
 * Production never falls back to localhost.
 */
export function resolveSiteUrl(
  siteUrl?: string,
  env: NodeJS.ProcessEnv = process.env,
): string {
  const raw =
    siteUrl?.trim() ||
    env['SITE_URL']?.trim() ||
    env['NEXT_PUBLIC_SITE_URL']?.trim() ||
    '';

  const nodeEnv = env['NODE_ENV'] ?? process.env['NODE_ENV'];
  const isProduction = nodeEnv === 'production';

  if (!raw) {
    if (isProduction) {
      throw new Error(
        'SITE_URL or NEXT_PUBLIC_SITE_URL must be set to your public HTTPS origin in production (e.g. https://offlinegamenia.com).',
      );
    }
    return DEV_FALLBACK_SITE_URL;
  }

  const base = raw.replace(/\/$/, '');

  if (isProduction && isLocalhostUrl(base)) {
    throw new Error(
      `SITE_URL/NEXT_PUBLIC_SITE_URL must not be localhost in production (got "${base}"). Set https://offlinegamenia.com (or your real domain).`,
    );
  }

  return base;
}

export function buildSubscriptionCheckoutUrls(planSlug: string, siteUrl?: string) {
  const base = resolveSiteUrl(siteUrl);

  return {
    successUrl: `${base}/checkout/success?session_id={CHECKOUT_TRANSACTION_ID}`,
    cancelUrl: `${base}/subscriptions?plan=${encodeURIComponent(planSlug)}&cancelled=1`,
  };
}

export function buildCheckoutUrls(gameSlug: string, siteUrl?: string) {
  const base = resolveSiteUrl(siteUrl);

  return {
    successUrl: `${base}/checkout/success?session_id={CHECKOUT_TRANSACTION_ID}`,
    cancelUrl: `${base}/checkout?game=${encodeURIComponent(gameSlug)}&cancelled=1&session_id={CHECKOUT_TRANSACTION_ID}`,
  };
}

export function priceToUnitAmount(priceBase: number): number {
  if (!Number.isFinite(priceBase) || priceBase <= 0) {
    throw new Error('priceBase must be a positive number');
  }
  return Math.round(priceBase * 100);
}

/** Paddle product images must be absolute https URLs; relative paths are omitted. */
export function resolvePaddleProductImage(
  coverImage?: string | null,
): string | undefined {
  const trimmed = coverImage?.trim();
  if (!trimmed) {
    return undefined;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:') {
      return trimmed;
    }
  } catch {
    // Relative path or invalid URL — omit for Paddle.
  }

  return undefined;
}
