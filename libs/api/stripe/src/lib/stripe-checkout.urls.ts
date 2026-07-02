export function resolveSiteUrl(siteUrl?: string): string {
  const base = siteUrl ?? process.env['NEXT_PUBLIC_SITE_URL'] ?? 'http://localhost:3000';
  return base.replace(/\/$/, '');
}

export function buildSubscriptionCheckoutUrls(planSlug: string, siteUrl?: string) {
  const base = resolveSiteUrl(siteUrl);

  return {
    successUrl: `${base}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${base}/subscriptions?plan=${encodeURIComponent(planSlug)}&cancelled=1`,
  };
}

export function buildCheckoutUrls(gameSlug: string, siteUrl?: string) {
  const base = resolveSiteUrl(siteUrl);

  return {
    successUrl: `${base}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${base}/checkout?game=${encodeURIComponent(gameSlug)}&cancelled=1`,
  };
}

export function priceToUnitAmount(priceBase: number): number {
  if (!Number.isFinite(priceBase) || priceBase <= 0) {
    throw new Error('priceBase must be a positive number');
  }
  return Math.round(priceBase * 100);
}

/** Stripe requires absolute http(s) URLs for product images; relative paths are omitted. */
export function resolveStripeProductImage(
  coverImage?: string | null,
): string | undefined {
  const trimmed = coverImage?.trim();
  if (!trimmed) {
    return undefined;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return trimmed;
    }
  } catch {
    // Relative path (e.g. /og/default.png) — omit for Stripe.
  }

  return undefined;
}
