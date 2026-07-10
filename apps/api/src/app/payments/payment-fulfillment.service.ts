import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type Stripe from 'stripe';
import {
  GameAccountsRepository,
  defaultLicenseExpiresAt,
  generateLicenseKey,
  OrdersRepository,
} from '@gamestore/api/data-access';
import { PrismaService } from '@gamestore/api/prisma';
import { StripeService } from '@gamestore/api/stripe';

export type FulfillmentAction =
  | 'fulfilled'
  | 'already_fulfilled'
  | 'pending_payment'
  | 'order_not_found'
  | 'invalid_game'
  | 'marked_failed'
  | 'ignored';

export type FulfillmentResult = {
  action: FulfillmentAction;
  orderId?: string;
  licenseId?: string;
};

@Injectable()
export class PaymentFulfillmentService {
  private readonly logger = new Logger(PaymentFulfillmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersRepository,
    private readonly gameAccounts: GameAccountsRepository,
    private readonly stripe: StripeService,
  ) {}

  async syncFulfillmentFromStripe(sessionId: string): Promise<FulfillmentResult> {
    try {
      const session = await this.stripe.retrieveCheckoutSession(sessionId);
      return this.syncCheckoutSession(session);
    } catch (error) {
      this.logger.warn(
        `Could not sync fulfillment from Stripe for session ${sessionId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return { action: 'ignored' };
    }
  }

  async cancelCheckoutSession(sessionId: string): Promise<FulfillmentResult> {
    try {
      const session = await this.stripe.retrieveCheckoutSession(sessionId);
      if (session.mode === 'subscription') {
        return { action: 'ignored' };
      }

      if (!session.id) {
        return { action: 'ignored' };
      }

      if (session.payment_status === 'paid') {
        return this.handleCheckoutSessionCompleted(session);
      }

      return this.handleCheckoutSessionFailed(sessionId);
    } catch (error) {
      this.logger.warn(
        `Could not cancel checkout session ${sessionId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return { action: 'ignored' };
    }
  }

  private async syncCheckoutSession(
    session: Stripe.Checkout.Session,
  ): Promise<FulfillmentResult> {
    if (session.mode === 'subscription') {
      return { action: 'ignored' };
    }

    const sessionId = session.id;
    if (!sessionId) {
      return { action: 'ignored' };
    }

    if (session.status === 'expired') {
      return this.handleCheckoutSessionFailed(sessionId);
    }

    if (session.payment_status === 'paid') {
      return this.handleCheckoutSessionCompleted(session);
    }

    return { action: 'pending_payment' };
  }

  async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<FulfillmentResult> {
    if (session.mode === 'subscription') {
      return { action: 'ignored' };
    }

    if (session.payment_status !== 'paid') {
      return { action: 'pending_payment' };
    }

    const sessionId = session.id;
    if (!sessionId) {
      return { action: 'ignored' };
    }

    const order = await this.orders.findByStripeSessionId(sessionId);
    if (!order) {
      this.logger.warn(`No order found for Stripe session ${sessionId}`);
      return { action: 'order_not_found' };
    }

    if (order.status === 'completed') {
      return {
        action: 'already_fulfilled',
        orderId: order.id,
        licenseId: order.license?.id,
      };
    }

    const gameId = session.metadata?.gameId ?? order.gameId;
    if (!gameId) {
      this.logger.error(
        `Cannot fulfill order ${order.id}: missing gameId for session ${sessionId}`,
      );
      return { action: 'invalid_game', orderId: order.id };
    }

    const ownerId =
      session.metadata?.userId?.trim() || order.ownerId || undefined;
    const buyerEmail =
      session.customer_details?.email ??
      session.customer_email ??
      undefined;
    const stripePaymentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id;
    const amount =
      session.amount_total !== null && session.amount_total !== undefined
        ? session.amount_total / 100
        : undefined;

    await this.warnIfNoPoolCapacity(gameId);

    const validFrom = new Date();
    const license = await this.fulfillOrderInTransaction({
      orderId: order.id,
      gameId,
      buyerEmail,
      ownerId,
      validFrom,
      stripePaymentId,
      amount,
    });

    return {
      action: 'fulfilled',
      orderId: order.id,
      licenseId: license.id,
    };
  }

  async handleCheckoutSessionFailed(sessionId: string): Promise<FulfillmentResult> {
    const order = await this.orders.findByStripeSessionId(sessionId);
    if (!order || order.status !== 'pending') {
      return { action: 'ignored' };
    }

    await this.orders.markFailed(sessionId);
    return { action: 'marked_failed', orderId: order.id };
  }

  private async fulfillOrderInTransaction(input: {
    orderId: string;
    gameId: string;
    buyerEmail?: string;
    ownerId?: string;
    validFrom: Date;
    stripePaymentId?: string;
    amount?: number;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const license = await this.createLicenseWithRetryInTx(tx, {
        gameId: input.gameId,
        buyerEmail: input.buyerEmail,
        ownerId: input.ownerId,
        validFrom: input.validFrom,
      });

      await tx.order.update({
        where: { id: input.orderId },
        data: {
          status: 'completed',
          licenseId: license.id,
          stripePaymentId: input.stripePaymentId,
          buyerEmail: input.buyerEmail,
          ...(input.amount !== undefined ? { amount: input.amount } : {}),
          ...(input.ownerId !== undefined ? { ownerId: input.ownerId } : {}),
        },
      });

      return license;
    });
  }

  private async warnIfNoPoolCapacity(gameId: string): Promise<void> {
    const poolAccount = await this.gameAccounts.findAvailableForGame(gameId);
    if (!poolAccount) {
      this.logger.warn(
        `No available pool account for game ${gameId} license will be issued but activation may fail`,
      );
    }
  }

  private async createLicenseWithRetryInTx(
    tx: Prisma.TransactionClient,
    input: {
      gameId: string;
      buyerEmail?: string;
      ownerId?: string;
      validFrom: Date;
    },
  ) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await tx.license.create({
          data: {
            licenseKey: generateLicenseKey(),
            status: 'available',
            source: 'purchase',
            validFrom: input.validFrom,
            expiresAt: defaultLicenseExpiresAt(input.validFrom),
            buyerEmail: input.buyerEmail,
            game: { connect: { id: input.gameId } },
            ...(input.ownerId ? { owner: { connect: { id: input.ownerId } } } : {}),
          },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002' &&
          attempt < 2
        ) {
          continue;
        }
        throw error;
      }
    }

    throw new Error('Failed to generate a unique license key');
  }
}
