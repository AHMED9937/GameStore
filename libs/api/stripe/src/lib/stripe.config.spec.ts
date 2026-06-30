import { describe, expect, it, vi } from 'vitest';
import { StripeConfig } from './stripe.config';

describe('StripeConfig', () => {
  it('returns setup response for health', () => {
    expect(StripeConfig.getHealthResponse()).toMatchObject({
      status: 'setup',
      integration: 'stripe',
    });
    expect(StripeConfig.getHealthResponse().message).toMatch(
      /not implemented yet$/,
    );
  });

  it('validates secret key format without calling Stripe', () => {
    expect(StripeConfig.validateSecretKey('')).toBe('missing');
    expect(StripeConfig.validateSecretKey('sk_test_abc')).toBe('valid');
    expect(StripeConfig.validateSecretKey('not-a-key')).toBe('invalid');
  });

  it('validates webhook secret format', () => {
    expect(StripeConfig.validateWebhookSecret('')).toBe('missing');
    expect(StripeConfig.validateWebhookSecret('whsec_abc')).toBe('valid');
    expect(StripeConfig.validateWebhookSecret('bad')).toBe('invalid');
  });

  it('validates publishable key format', () => {
    expect(StripeConfig.validatePublishableKey('')).toBe('missing');
    expect(StripeConfig.validatePublishableKey('pk_test_abc')).toBe('valid');
    expect(StripeConfig.validatePublishableKey('bad')).toBe('invalid');
  });

  it('reads env vars and reports status without Stripe API calls', () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_abc');
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', '');
    vi.stubEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'pk_test_abc');

    expect(StripeConfig.readEnv()).toEqual({
      secretKey: 'sk_test_abc',
      webhookSecret: '',
      publishableKey: 'pk_test_abc',
    });
    expect(StripeConfig.getEnvStatus()).toEqual({
      secretKey: 'valid',
      webhookSecret: 'missing',
      publishableKey: 'valid',
    });

    vi.unstubAllEnvs();
  });
});
