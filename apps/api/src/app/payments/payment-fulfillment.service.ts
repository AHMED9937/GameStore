import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type Stripe from 'stripe';
import {
  GameAccountsRepository,
  generateLicenseKey,
  OrdersRepository,
} from '@gamestore/api/data-access';
import { PrismaService } from '@gamestore/api/prisma';

export type FulfillmentAction =
  | 'fulfilled'
  | 'already_fulfilled'
  | 'pending_payment'
  | 'order_not_found'
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
  ) {}

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
    const license = await this.createLicenseWithRetry(
      gameId,
      buyerEmail,
      ownerId,
      validFrom,
    );

    await this.orders.markCompleted(order.id, {
      licenseId: license.id,
      stripePaymentId,
      buyerEmail,
      amount,
      ownerId,
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

  private async warnIfNoPoolCapacity(gameId: string): Promise<void> {
    const poolAccount = await this.gameAccounts.findAvailableForGame(gameId);
    if (!poolAccount) {
      this.logger.warn(
        `No available pool account for game ${gameId} — license will be issued but activation may fail`,
      );
    }
  }

  private async createLicenseWithRetry(
    gameId: string,
    buyerEmail?: string,
    ownerId?: string,
    validFrom: Date = new Date(),
  ) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.prisma.license.create({
          data: {
            licenseKey: generateLicenseKey(),
            status: 'available',
            source: 'purchase',
            validFrom,
            expiresAt: null,
            buyerEmail,
            game: { connect: { id: gameId } },
            ...(ownerId ? { owner: { connect: { id: ownerId } } } : {}),
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
