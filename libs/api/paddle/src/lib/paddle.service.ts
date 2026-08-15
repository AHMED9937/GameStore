import { Injectable } from '@nestjs/common';
import { Environment, Paddle } from '@paddle/paddle-node-sdk';
import type {
  CreateTransactionRequestBody,
  Transaction,
} from '@paddle/paddle-node-sdk';
import { PaddleConfig } from './paddle.config';
import { priceToUnitAmount } from './paddle-checkout.urls';
import type {
  CreateCheckoutTransactionInput,
  CreateCheckoutTransactionResult,
  CreateSubscriptionCheckoutTransactionInput,
} from './paddle-checkout.types';
import { PaddleMisconfiguredError } from './paddle-misconfigured.error';

@Injectable()
export class PaddleService {
  private client: Paddle | null = null;

  health() {
    return PaddleConfig.getHealthResponse();
  }

  /** Legacy setup stub replaced by createCheckoutTransaction in the payments flow. */
  createCheckout() {
    return PaddleConfig.getSetupResponse('checkout');
  }

  async createCheckoutTransaction(
    input: CreateCheckoutTransactionInput,
  ): Promise<CreateCheckoutTransactionResult> {
    const client = this.getClient();
    const unitAmount = priceToUnitAmount(input.priceBase);

    if (!input.productId) {
      throw new PaddleMisconfiguredError(
        'Game is missing a Paddle product ID. Publish the game to create the Paddle catalog entry first.',
      );
    }

    const requestBody: CreateTransactionRequestBody = {
      items: [
        {
          price: {
            productId: input.productId,
            description: input.title,
            unitPrice: {
              amount: unitAmount.toString(),
              currencyCode: 'USD',
            },
          },
          quantity: 1,
        },
      ],
      collectionMode: 'automatic',
      customData: {
        gameId: input.gameId,
        gameSlug: input.gameSlug,
        userId: input.userId ?? '',
        ...(input.customerEmail ? { customerEmail: input.customerEmail } : {}),
      },
    };

    const transaction = await client.transactions.create(requestBody);
    return this.toCheckoutResult(transaction);
  }

  async createSubscriptionCheckoutTransaction(
    input: CreateSubscriptionCheckoutTransactionInput,
  ): Promise<CreateCheckoutTransactionResult> {
    const client = this.getClient();

    if (!input.providerPriceId) {
      throw new PaddleMisconfiguredError(
        'Subscription plan is missing a Paddle price ID.',
      );
    }

    const requestBody: CreateTransactionRequestBody = {
      items: [{ priceId: input.providerPriceId, quantity: 1 }],
      collectionMode: 'automatic',
      customData: {
        planId: input.planId,
        planSlug: input.planSlug,
        userId: input.userId,
        ...(input.customerEmail ? { customerEmail: input.customerEmail } : {}),
      },
    };

    const transaction = await client.transactions.create(requestBody);
    return this.toCheckoutResult(transaction);
  }

  async retrieveTransaction(transactionId: string): Promise<Transaction> {
    return this.getClient().transactions.get(transactionId);
  }

  async retrieveSubscription(subscriptionId: string) {
    return this.getClient().subscriptions.get(subscriptionId);
  }

  unmarshalWebhook(rawBody: Buffer | string, signature: string) {
    const { webhookSecret } = PaddleConfig.readEnv();
    if (PaddleConfig.validateWebhookSecret(webhookSecret) !== 'valid') {
      throw new PaddleMisconfiguredError(
        'PADDLE_NOTIFICATION_WEBHOOK_SECRET is missing or invalid',
      );
    }

    return this.getClient().webhooks.unmarshal(
      rawBody.toString(),
      webhookSecret,
      signature,
    );
  }

  getClient(): Paddle {
    if (!this.client) {
      const { apiKey, environment } = PaddleConfig.readEnv();
      if (PaddleConfig.validateApiKey(apiKey) !== 'valid') {
        throw new PaddleMisconfiguredError(
          'PADDLE_API_KEY is missing or invalid',
        );
      }

      this.client = new Paddle(apiKey, {
        environment:
          environment === 'production' ? Environment.production : Environment.sandbox,
      });
    }

    return this.client;
  }

  private toCheckoutResult(
    transaction: Transaction,
  ): CreateCheckoutTransactionResult {
    const transactionId = transaction.id;
    const checkoutUrl = transaction.checkout?.url;

    if (!transactionId) {
      throw new Error('Paddle transaction missing id');
    }

    if (!checkoutUrl) {
      throw new Error(
        'Paddle transaction did not return a checkout URL. Set a default payment link in Paddle and subscribe this webhook destination to checkout events.',
      );
    }

    return {
      transactionId,
      url: checkoutUrl,
    };
  }
}
