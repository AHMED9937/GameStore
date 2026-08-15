import { afterEach, describe, expect, it } from 'vitest';
import {
  buildCheckoutUrls,
  priceToUnitAmount,
  resolveSiteUrl,
  resolveStripeProductImage,
} from './stripe-checkout.urls';

describe('stripe-checkout.urls', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('builds success and cancel URLs from site base', () => {
    expect(buildCheckoutUrls('demo-game-1', 'http://localhost:3000')).toEqual({
      successUrl:
        'http://localhost:3000/checkout/success?session_id={CHECKOUT_SESSION_ID}',
      cancelUrl:
        'http://localhost:3000/checkout?game=demo-game-1&cancelled=1&session_id={CHECKOUT_SESSION_ID}',
    });
  });

  it('strips trailing slash from site URL', () => {
    expect(resolveSiteUrl('http://localhost:3000/')).toBe('http://localhost:3000');
  });

  it('prefers SITE_URL over NEXT_PUBLIC_SITE_URL', () => {
    expect(
      resolveSiteUrl(undefined, {
        SITE_URL: 'https://from-site-url.example/',
        NEXT_PUBLIC_SITE_URL: 'https://from-next-public.example',
        NODE_ENV: 'development',
      }),
    ).toBe('https://from-site-url.example');
  });

  it('falls back to localhost in non-production when unset', () => {
    expect(
      resolveSiteUrl(undefined, {
        NODE_ENV: 'development',
      }),
    ).toBe('http://localhost:3000');
  });

  it('rejects missing site URL in production', () => {
    expect(() =>
      resolveSiteUrl(undefined, {
        NODE_ENV: 'production',
      }),
    ).toThrow(/SITE_URL or NEXT_PUBLIC_SITE_URL must be set/);
  });

  it('rejects localhost site URL in production', () => {
    expect(() =>
      resolveSiteUrl(undefined, {
        NODE_ENV: 'production',
        NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
      }),
    ).toThrow(/must not be localhost in production/);
  });

  it('accepts production HTTPS origin', () => {
    expect(
      resolveSiteUrl(undefined, {
        NODE_ENV: 'production',
        NEXT_PUBLIC_SITE_URL: 'https://offlinegamenia.com/',
      }),
    ).toBe('https://offlinegamenia.com');
  });

  it('converts dollar price to Stripe cents', () => {
    expect(priceToUnitAmount(19.99)).toBe(1999);
  });

  it('rejects non-positive prices', () => {
    expect(() => priceToUnitAmount(0)).toThrow('priceBase must be a positive number');
  });

  it('resolveStripeProductImage accepts absolute https URLs', () => {
    expect(resolveStripeProductImage('https://cdn.example.com/cover.jpg')).toBe(
      'https://cdn.example.com/cover.jpg',
    );
  });

  it('resolveStripeProductImage omits relative paths', () => {
    expect(resolveStripeProductImage('/og/default.png')).toBeUndefined();
  });

  it('resolveStripeProductImage omits empty values', () => {
    expect(resolveStripeProductImage(null)).toBeUndefined();
    expect(resolveStripeProductImage('')).toBeUndefined();
  });
});
