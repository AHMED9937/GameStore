import { describe, expect, it } from 'vitest';
import {
  buildCheckoutUrls,
  priceToUnitAmount,
  resolveSiteUrl,
  resolveStripeProductImage,
} from './stripe-checkout.urls';

describe('stripe-checkout.urls', () => {
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
