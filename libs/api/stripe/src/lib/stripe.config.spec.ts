import { describe, expect, it, vi } from 'vitest';
import { StripeConfig } from './stripe.config';

describe('StripeConfig', () => {
  it('returns misconfigured health when env vars are absent', () => {
    vi.stubEnv('STRIPE_SECRET_KEY', '');
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', '');
    vi.stubEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', '');

    expect(StripeConfig.getHealthResponse()).toEqual({
      status: 'misconfigured',
      integration: 'stripe',
      env: {
        secretKey: 'missing',
        webhookSecret: 'missing',
        publishableKey: 'missing',
      },
    });

    vi.unstubAllEnvs();
  });

  it('returns ok health when all Stripe env vars are valid', () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_abc');
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_abc');
    vi.stubEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'pk_test_abc');

    expect(StripeConfig.getHealthResponse()).toEqual({
      status: 'ok',
      integration: 'stripe',
      env: {
        secretKey: 'valid',
        webhookSecret: 'valid',
        publishableKey: 'valid',
      },
    });

    vi.unstubAllEnvs();
  });

  it('returns misconfigured when webhook secret is missing', () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_abc');
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', '');
    vi.stubEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'pk_test_abc');

    expect(StripeConfig.getHealthResponse()).toMatchObject({
      status: 'misconfigured',
      env: {
        secretKey: 'valid',
        webhookSecret: 'missing',
        publishableKey: 'valid',
      },
    });

    vi.unstubAllEnvs();
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

  it('allows checkout when secret and publishable keys are valid without webhook', () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_abc');
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', '');
    vi.stubEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'pk_test_abc');

    expect(StripeConfig.isCheckoutConfigured()).toBe(true);
    expect(StripeConfig.isEnvConfigured()).toBe(false);

    vi.unstubAllEnvs();
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
