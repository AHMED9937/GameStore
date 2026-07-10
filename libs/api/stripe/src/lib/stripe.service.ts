import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { StripeConfig } from './stripe.config';
import {
  buildCheckoutUrls,
  buildSubscriptionCheckoutUrls,
  priceToUnitAmount,
  resolveStripeProductImage,
} from './stripe-checkout.urls';
import type {
  CreateCheckoutSessionInput,
  CreateCheckoutSessionResult,
  CreateSubscriptionCheckoutSessionInput,
} from './stripe-checkout.types';
import { StripeMisconfiguredError } from './stripe-misconfigured.error';

const STRIPE_API_VERSION = '2026-06-24.dahlia';

@Injectable()
export class StripeService {
  private client: Stripe | null = null;

  health() {
    return StripeConfig.getHealthResponse();
  }

  /** Legacy setup stub replaced by createCheckoutSession in SP.3 payments flow */
  createCheckout() {
    return StripeConfig.getSetupResponse('checkout');
  }

  async createCheckoutSession(
    input: CreateCheckoutSessionInput,
  ): Promise<CreateCheckoutSessionResult> {
    const client = this.getClient();
    const { successUrl, cancelUrl } = buildCheckoutUrls(input.gameSlug);
    const unitAmount = priceToUnitAmount(input.priceBase);
    const productImage = resolveStripeProductImage(input.coverImage);

    const session = await client.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: unitAmount,
            product_data: {
              name: input.title,
              ...(productImage ? { images: [productImage] } : {}),
            },
          },
        },
      ],
      metadata: {
        gameId: input.gameId,
        gameSlug: input.gameSlug,
        userId: input.userId ?? '',
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      ...(input.customerEmail ? { customer_email: input.customerEmail } : {}),
    });

    if (!session.id || !session.url) {
      throw new Error('Stripe checkout session missing id or url');
    }

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  async createSubscriptionCheckoutSession(
    input: CreateSubscriptionCheckoutSessionInput,
  ): Promise<CreateCheckoutSessionResult> {
    const client = this.getClient();
    const { successUrl, cancelUrl } = buildSubscriptionCheckoutUrls(input.planSlug);

    const session = await client.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          quantity: 1,
          price: input.stripePriceId,
        },
      ],
      metadata: {
        planId: input.planId,
        planSlug: input.planSlug,
        userId: input.userId,
      },
      subscription_data: {
        metadata: {
          planId: input.planId,
          planSlug: input.planSlug,
          userId: input.userId,
        },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      ...(input.customerEmail ? { customer_email: input.customerEmail } : {}),
    });

    if (!session.id || !session.url) {
      throw new Error('Stripe subscription checkout session missing id or url');
    }

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  async retrieveSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return this.getClient().subscriptions.retrieve(subscriptionId);
  }

  async retrieveCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
    return this.getClient().checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'],
    });
  }

  constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
    const { webhookSecret } = StripeConfig.readEnv();
    if (StripeConfig.validateWebhookSecret(webhookSecret) !== 'valid') {
      throw new StripeMisconfiguredError(
        'STRIPE_WEBHOOK_SECRET is missing or invalid',
      );
    }

    return this.getClient().webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );
  }

  getClient(): Stripe {
    if (!this.client) {
      const { secretKey } = StripeConfig.readEnv();
      if (StripeConfig.validateSecretKey(secretKey) !== 'valid') {
        throw new StripeMisconfiguredError(
          'STRIPE_SECRET_KEY is missing or invalid',
        );
      }

      this.client = new Stripe(secretKey, {
        apiVersion: STRIPE_API_VERSION,
      });
    }

    return this.client;
  }
}
