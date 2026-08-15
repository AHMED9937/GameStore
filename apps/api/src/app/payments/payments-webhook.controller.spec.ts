import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuditLogService } from '@gamestore/api/auth';
import { StripeMisconfiguredError, StripeService } from '@gamestore/api/stripe';
import type { PaymentFulfillmentService } from './payment-fulfillment.service';
import { PaymentsWebhookController } from './payments-webhook.controller';
import type { SubscriptionFulfillmentService } from './subscription-fulfillment.service';

describe('PaymentsWebhookController', () => {
  const stripe = {
    constructWebhookEvent: vi.fn(),
  } as unknown as StripeService;

  const fulfillment = {
    handleCheckoutSessionCompleted: vi.fn(),
    handleCheckoutSessionFailed: vi.fn(),
  } as unknown as PaymentFulfillmentService;

  const subscriptionFulfillment = {
    handleCheckoutSessionCompleted: vi.fn(),
    handleInvoicePaid: vi.fn(),
    handleSubscriptionUpdated: vi.fn(),
    handleSubscriptionDeleted: vi.fn(),
  } as unknown as SubscriptionFulfillmentService;

  const auditLogService = {
    log: vi.fn().mockResolvedValue(undefined),
  } as unknown as AuditLogService;

  let controller: PaymentsWebhookController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new PaymentsWebhookController(
      stripe,
      fulfillment,
      subscriptionFulfillment,
      auditLogService,
    );
  });

  it('routes checkout.session.completed to payment fulfillment', async () => {
    const session = {
      id: 'cs_test_abc',
      mode: 'payment',
      payment_status: 'paid',
    };
    vi.mocked(stripe.constructWebhookEvent).mockReturnValue({
      id: 'evt_1',
      type: 'checkout.session.completed',
      data: { object: session },
    } as never);
    vi.mocked(fulfillment.handleCheckoutSessionCompleted).mockResolvedValue({
      action: 'fulfilled',
      orderId: 'order-1',
      licenseId: 'lic-1',
    });

    const response = await controller.handleWebhook(
      { rawBody: Buffer.from('{}'), ip: '127.0.0.1' },
      'sig_test',
    );

    expect(fulfillment.handleCheckoutSessionCompleted).toHaveBeenCalledWith(
      session,
    );
    expect(response).toEqual({ received: true, action: 'fulfilled' });
  });

  it('routes checkout.session.async_payment_succeeded to payment fulfillment', async () => {
    const session = {
      id: 'cs_test_async',
      mode: 'payment',
      payment_status: 'paid',
    };
    vi.mocked(stripe.constructWebhookEvent).mockReturnValue({
      id: 'evt_2',
      type: 'checkout.session.async_payment_succeeded',
      data: { object: session },
    } as never);
    vi.mocked(fulfillment.handleCheckoutSessionCompleted).mockResolvedValue({
      action: 'fulfilled',
      orderId: 'order-2',
      licenseId: 'lic-2',
    });

    const response = await controller.handleWebhook(
      { rawBody: Buffer.from('{}'), ip: '127.0.0.1' },
      'sig_test',
    );

    expect(fulfillment.handleCheckoutSessionCompleted).toHaveBeenCalledWith(
      session,
    );
    expect(response).toEqual({ received: true, action: 'fulfilled' });
  });

  it('rejects missing stripe-signature header', async () => {
    await expect(
      controller.handleWebhook({ rawBody: Buffer.from('{}') }, undefined),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns service unavailable when webhook secret is misconfigured', async () => {
    vi.mocked(stripe.constructWebhookEvent).mockImplementation(() => {
      throw new StripeMisconfiguredError('STRIPE_WEBHOOK_SECRET is missing or invalid');
    });

    await expect(
      controller.handleWebhook(
        { rawBody: Buffer.from('{}') },
        'sig_test',
      ),
    ).rejects.toMatchObject({ status: 503 });
  });
});
