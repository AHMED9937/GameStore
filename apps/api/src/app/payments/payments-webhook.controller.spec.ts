import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuditLogService } from '@gamestore/api/auth';
import { PaddleMisconfiguredError, PaddleService } from '@gamestore/api/paddle';
import type { PaymentFulfillmentService } from './payment-fulfillment.service';
import { PaymentsWebhookController } from './payments-webhook.controller';
import type { SubscriptionFulfillmentService } from './subscription-fulfillment.service';

describe('PaymentsWebhookController', () => {
  const paddle = {
    unmarshalWebhook: vi.fn(),
  } as unknown as PaddleService;

  const fulfillment = {
    handleTransactionCompleted: vi.fn(),
    handleTransactionFailed: vi.fn(),
  } as unknown as PaymentFulfillmentService;

  const subscriptionFulfillment = {
    handleTransactionCompletedForSubscription: vi.fn(),
    handleSubscriptionActivated: vi.fn(),
    handleSubscriptionUpdated: vi.fn(),
    handleSubscriptionCanceled: vi.fn(),
  } as unknown as SubscriptionFulfillmentService;

  const auditLogService = {
    log: vi.fn().mockResolvedValue(undefined),
  } as unknown as AuditLogService;

  let controller: PaymentsWebhookController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new PaymentsWebhookController(
      paddle,
      fulfillment,
      subscriptionFulfillment,
      auditLogService,
    );
  });

  it('routes transaction.completed to payment fulfillment for one-time payments', async () => {
    const transaction = {
      id: 'txn_test_abc',
      status: 'completed',
      subscriptionId: null,
    };
    vi.mocked(paddle.unmarshalWebhook).mockResolvedValue({
      eventId: 'evt_1',
      eventType: 'transaction.completed',
      data: transaction,
    } as never);
    vi.mocked(fulfillment.handleTransactionCompleted).mockResolvedValue({
      action: 'fulfilled',
      orderId: 'order-1',
      licenseId: 'lic-1',
    });

    const response = await controller.handleWebhook(
      { rawBody: Buffer.from('{}'), ip: '127.0.0.1' },
      'sig_test',
    );

    expect(fulfillment.handleTransactionCompleted).toHaveBeenCalledWith(
      transaction,
    );
    expect(response).toEqual({ received: true, action: 'fulfilled' });
  });

  it('routes transaction.completed with subscriptionId to subscription fulfillment', async () => {
    const transaction = {
      id: 'txn_sub_test',
      status: 'completed',
      subscriptionId: 'sub_paddle_123',
    };
    vi.mocked(paddle.unmarshalWebhook).mockResolvedValue({
      eventId: 'evt_2',
      eventType: 'transaction.completed',
      data: transaction,
    } as never);
    vi.mocked(subscriptionFulfillment.handleTransactionCompletedForSubscription).mockResolvedValue({
      action: 'subscription_fulfilled',
      subscriptionId: 'sub-1',
      licenseIds: ['lic-1'],
    });

    const response = await controller.handleWebhook(
      { rawBody: Buffer.from('{}'), ip: '127.0.0.1' },
      'sig_test',
    );

    expect(subscriptionFulfillment.handleTransactionCompletedForSubscription).toHaveBeenCalledWith(
      transaction,
    );
    expect(response).toEqual({ received: true, action: 'subscription_fulfilled' });
  });

  it('rejects missing paddle-signature header', async () => {
    await expect(
      controller.handleWebhook({ rawBody: Buffer.from('{}') }, undefined),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns service unavailable when webhook secret is misconfigured', async () => {
    vi.mocked(paddle.unmarshalWebhook).mockImplementation(() => {
      throw new PaddleMisconfiguredError('PADDLE_NOTIFICATION_WEBHOOK_SECRET is missing or invalid');
    });

    await expect(
      controller.handleWebhook(
        { rawBody: Buffer.from('{}') },
        'sig_test',
      ),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
