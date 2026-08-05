import { randomUUID } from 'node:crypto';
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Transaction, TransactionNotification } from '@paddle/paddle-node-sdk';
import {
  GameAccountsRepository,
  defaultLicenseExpiresAt,
  generateLicenseKey,
  LicensesRepository,
  OrdersRepository,
} from '@gamestore/api/data-access';
import { PrismaService } from '@gamestore/api/prisma';
import { PaddleService } from '@gamestore/api/paddle';

export type FulfillmentAction =
  | 'fulfilled'
  | 'already_fulfilled'
  | 'pending_payment'
  | 'order_not_found'
  | 'invalid_game'
  | 'no_pool_capacity'
  | 'marked_failed'
  | 'ignored';

export type FulfillmentResult = {
  action: FulfillmentAction;
  orderId?: string;
  licenseId?: string;
};

type TransactionLike =
  | Transaction
  | TransactionNotification
  | { id: string; status: string };

function isPaddleTransactionCompleted(
  transaction: TransactionLike,
): boolean {
  return (
    transaction.status === 'completed' ||
    transaction.status === 'paid'
  );
}

function isPaddleTransactionFailed(transaction: TransactionLike): boolean {
  return (
    transaction.status === 'canceled' ||
    transaction.status === 'past_due'
  );
}

function readCustomDataString(
  customData: Record<string, unknown> | null,
  key: string,
): string | undefined {
  const value = customData?.[key];
  if (typeof value === 'string') {
    return value.trim() || undefined;
  }
  return undefined;
}

function minorToDecimal(amount: string | null | undefined): number | undefined {
  if (!amount) return undefined;
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) return undefined;
  return numeric / 100;
}

@Injectable()
export class PaymentFulfillmentService {
  private readonly logger = new Logger(PaymentFulfillmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersRepository,
    private readonly gameAccounts: GameAccountsRepository,
    private readonly paddle: PaddleService,
    private readonly licenses: LicensesRepository,
  ) {}

  async syncFulfillmentFromPaddle(
    checkoutId: string,
  ): Promise<FulfillmentResult> {
    try {
      const transaction = await this.paddle.retrieveTransaction(checkoutId);
      return this.syncTransaction(transaction);
    } catch (error) {
      this.logger.warn(
        `Could not sync fulfillment from Paddle for transaction ${checkoutId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return { action: 'ignored' };
    }
  }

  async cancelPaddleTransaction(
    checkoutId: string,
  ): Promise<FulfillmentResult> {
    try {
      const transaction = await this.paddle.retrieveTransaction(checkoutId);

      if (isPaddleTransactionCompleted(transaction)) {
        return this.handleTransactionCompleted(transaction);
      }

      return this.handleTransactionFailed(checkoutId);
    } catch (error) {
      this.logger.warn(
        `Could not cancel Paddle transaction ${checkoutId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return { action: 'ignored' };
    }
  }

  private async syncTransaction(
    transaction: Transaction,
  ): Promise<FulfillmentResult> {
    if (transaction.subscriptionId) {
      return { action: 'ignored' };
    }

    const checkoutId = transaction.id;
    if (!checkoutId) {
      return { action: 'ignored' };
    }

    if (isPaddleTransactionFailed(transaction)) {
      return this.handleTransactionFailed(checkoutId);
    }

    if (isPaddleTransactionCompleted(transaction)) {
      return this.handleTransactionCompleted(transaction);
    }

    return { action: 'pending_payment' };
  }

  async handleTransactionCompleted(
    transaction: Transaction | TransactionNotification,
  ): Promise<FulfillmentResult> {
    if (transaction.subscriptionId) {
      return { action: 'ignored' };
    }

    if (!isPaddleTransactionCompleted(transaction)) {
      return { action: 'pending_payment' };
    }

    const checkoutId = transaction.id;
    if (!checkoutId) {
      return { action: 'ignored' };
    }

    const order = await this.orders.findByProviderCheckoutId(checkoutId);
    if (!order) {
      this.logger.warn(`No order found for Paddle transaction ${checkoutId}`);
      return { action: 'order_not_found' };
    }

    if (order.status === 'completed') {
      return {
        action: 'already_fulfilled',
        orderId: order.id,
        licenseId: order.license?.id,
      };
    }

    const customData =
      'customData' in transaction ? transaction.customData : null;
    const gameId = readCustomDataString(customData, 'gameId') ?? order.gameId;
    if (!gameId) {
      this.logger.error(
        `Cannot fulfill order ${order.id}: missing gameId for transaction ${checkoutId}`,
      );
      return { action: 'invalid_game', orderId: order.id };
    }

    const ownerId =
      readCustomDataString(customData, 'userId') || order.ownerId || undefined;
    const buyerEmail = readCustomDataString(customData, 'customerEmail');
    const providerPaymentId = checkoutId;
    const amount =
      'details' in transaction && transaction.details?.totals?.grandTotal
        ? minorToDecimal(transaction.details.totals.grandTotal)
        : undefined;

    const validFrom = new Date();
    try {
      const license = await this.fulfillOrderInTransaction({
        orderId: order.id,
        gameId,
        buyerEmail,
        ownerId,
        validFrom,
        providerPaymentId,
        amount,
      });

      return {
        action: 'fulfilled',
        orderId: order.id,
        licenseId: license.id,
      };
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        this.logger.error(
          `Cannot fulfill order ${order.id}: no pool capacity for game ${gameId}`,
        );
        return { action: 'no_pool_capacity', orderId: order.id };
      }
      throw error;
    }
  }

  /**
   * Grants a free (100%-off) game directly, with no Paddle round-trip.
   * Idempotent: a repeat claim by the same owner returns their existing
   * license/order instead of consuming another pool seat.
   */
  async fulfillFreeOrder(input: {
    gameId: string;
    gameTitleSnapshot?: string;
    gameSlugSnapshot?: string;
    ownerId: string;
    buyerEmail?: string;
  }): Promise<FulfillmentResult & { sessionId: string }> {
    const existing = await this.licenses.findActiveByOwnerAndGame(
      input.ownerId,
      input.gameId,
    );
    if (existing) {
      return {
        action: 'already_fulfilled',
        orderId: existing.order?.id,
        licenseId: existing.id,
        sessionId: existing.order?.providerCheckoutId ?? `free_${existing.id}`,
      };
    }

    const sessionId = `free_${randomUUID()}`;
    const validFrom = new Date();

    return this.prisma.$transaction(async (tx) => {
      const claimed = await this.gameAccounts.claimSeatForGame(
        input.gameId,
        undefined,
        tx,
      );
      if (!claimed) {
        throw new ServiceUnavailableException(
          'No pool account capacity for this game',
        );
      }

      const license = await this.createLicenseWithRetryInTx(tx, {
        gameId: input.gameId,
        accountId: claimed.id,
        buyerEmail: input.buyerEmail,
        ownerId: input.ownerId,
        validFrom,
        source: 'free',
      });

      const order = await tx.order.create({
        data: {
          gameId: input.gameId,
          gameTitleSnapshot: input.gameTitleSnapshot,
          gameSlugSnapshot: input.gameSlugSnapshot,
          providerCheckoutId: sessionId,
          amount: 0,
          status: 'completed',
          licenseId: license.id,
          ownerId: input.ownerId,
          buyerEmail: input.buyerEmail,
        },
      });

      await this.gameAccounts.advanceNextAccountIfFull(input.gameId, tx);

      return {
        action: 'fulfilled' as const,
        orderId: order.id,
        licenseId: license.id,
        sessionId,
      };
    }).catch((error) => {
      if (error instanceof ServiceUnavailableException) {
        this.logger.error(
          `Cannot fulfill free order: no pool capacity for game ${input.gameId}`,
        );
        return { action: 'no_pool_capacity' as const, sessionId };
      }
      throw error;
    });
  }

  async handleTransactionFailed(
    checkoutId: string,
  ): Promise<FulfillmentResult> {
    const order = await this.orders.findByProviderCheckoutId(checkoutId);
    if (!order || order.status !== 'pending') {
      return { action: 'ignored' };
    }

    await this.orders.markFailed(checkoutId);
    return { action: 'marked_failed', orderId: order.id };
  }

  private async fulfillOrderInTransaction(input: {
    orderId: string;
    gameId: string;
    buyerEmail?: string;
    ownerId?: string;
    validFrom: Date;
    providerPaymentId?: string;
    amount?: number;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const claimed = await this.gameAccounts.claimSeatForGame(
        input.gameId,
        undefined,
        tx,
      );
      if (!claimed) {
        throw new ServiceUnavailableException(
          'No pool account capacity for this game',
        );
      }

      const license = await this.createLicenseWithRetryInTx(tx, {
        gameId: input.gameId,
        accountId: claimed.id,
        buyerEmail: input.buyerEmail,
        ownerId: input.ownerId,
        validFrom: input.validFrom,
      });

      await tx.order.update({
        where: { id: input.orderId },
        data: {
          status: 'completed',
          licenseId: license.id,
          providerPaymentId: input.providerPaymentId,
          buyerEmail: input.buyerEmail,
          ...(input.amount !== undefined ? { amount: input.amount } : {}),
          ...(input.ownerId !== undefined ? { ownerId: input.ownerId } : {}),
        },
      });

      await this.gameAccounts.advanceNextAccountIfFull(input.gameId, tx);

      return license;
    });
  }

  private async createLicenseWithRetryInTx(
    tx: Prisma.TransactionClient,
    input: {
      gameId: string;
      accountId: string;
      buyerEmail?: string;
      ownerId?: string;
      validFrom: Date;
      source?: string;
    },
  ) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await tx.license.create({
          data: {
            licenseKey: generateLicenseKey(),
            status: 'available',
            source: input.source ?? 'purchase',
            validFrom: input.validFrom,
            expiresAt: defaultLicenseExpiresAt(input.validFrom),
            buyerEmail: input.buyerEmail,
            game: { connect: { id: input.gameId } },
            account: { connect: { id: input.accountId } },
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
