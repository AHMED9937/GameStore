import { describe, expect, it } from 'vitest';
import { StripeService } from './stripe.service';

describe('StripeService', () => {
  const service = new StripeService();

  it('returns setup text for health', () => {
    expect(service.health()).toMatchObject({
      status: 'setup',
      integration: 'stripe',
    });
    expect(service.health().message).toMatch(/not implemented yet$/);
  });

  it('returns setup text for checkout without Stripe SDK calls', () => {
    expect(service.createCheckout()).toEqual({
      status: 'setup',
      integration: 'stripe',
      message: 'Stripe checkout — not implemented yet',
    });
  });
});
