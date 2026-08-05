import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  Subscription,
  SubscriptionNotification,
  Transaction,
  TransactionNotification,
} from '@paddle/paddle-node-sdk';
import {
  GameAccountsRepository,
  generateLicenseKey,
  SubscriptionPlansRepository,
  UserSubscriptionsRepository,
} from '@gamestore/api/data-access';
import { PaddleService } from '@gamestore/api/paddle';
import { PrismaService } from '@gamestore/api/prisma';

export type SubscriptionFulfillmentAction =
  | 'subscription_fulfilled'
  | 'subscription_already_fulfilled'
  | 'subscription_renewed'
  | 'subscription_synced'
  | 'subscription_ended'
  | 'pending_payment'
  | 'ignored';

export type SubscriptionFulfillmentResult = {
  action: SubscriptionFulfillmentAction;
  subscriptionId?: string;
  licenseIds?: string[];
};

type SubscriptionLike = Subscription | SubscriptionNotification;
type TransactionLike = Transaction | TransactionNotification;

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

function parseBillingPeriod(period: {
  startsAt: string;
  endsAt: string;
}): { currentPeriodStart: Date; currentPeriodEnd: Date } {
  return {
    currentPeriodStart: new Date(period.startsAt),
    currentPeriodEnd: new Date(period.endsAt),
  };
}

function isCancelAtPeriodEnd(subscription: SubscriptionLike): boolean {
  if (subscription.status === 'canceled') {
    return true;
  }
  if (
    'scheduledChange' in subscription &&
    subscription.scheduledChange?.action === 'cancel'
  ) {
    return true;
  }
  return false;
}

@Injectable()
export class SubscriptionFulfillmentService {
  private readonly logger = new Logger(SubscriptionFulfillmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly plans: SubscriptionPlansRepository,
    private readonly userSubscriptions: UserSubscriptionsRepository,
    private readonly gameAccounts: GameAccountsRepository,
    private readonly paddle: PaddleService,
  ) {}

  async handleSubscriptionActivated(
    subscription: SubscriptionLike,
  ): Promise<SubscriptionFulfillmentResult> {
    const providerSubscriptionId = subscription.id;
    if (!providerSubscriptionId) {
      return { action: 'ignored' };
    }

    const customData = subscription.customData;
    const planId = readCustomDataString(customData, 'planId');
    const userId = readCustomDataString(customData, 'userId');
    if (!planId || !userId) {
      this.logger.warn(
        `Paddle subscription ${providerSubscriptionId} missing planId or userId in customData`,
      );
      return { action: 'ignored' };
    }

    const existing =
      await this.userSubscriptions.findByProviderSubscriptionId(providerSubscriptionId);
    if (existing) {
      return {
        action: 'subscription_already_fulfilled',
        subscriptionId: existing.id,
        licenseIds: existing.licenses.map((license) => license.id),
      };
    }

    const plan = await this.plans.findById(planId);
    if (!plan || !plan.isActive) {
      this.logger.warn(`Subscription plan ${planId} not found or inactive`);
      return { action: 'ignored' };
    }

    const period = this.readSubscriptionPeriod(subscription);
    const providerCustomerId = subscription.customerId;
    const buyerEmail =
      readCustomDataString(customData, 'customerEmail') ?? undefined;

    const userSubscription = await this.userSubscriptions.create({
      user: { connect: { id: userId } },
      plan: { connect: { id: plan.id } },
      providerSubscriptionId,
      providerCustomerId,
      status: subscription.status,
      currentPeriodStart: period.currentPeriodStart,
      currentPeriodEnd: period.currentPeriodEnd,
      cancelAtPeriodEnd: isCancelAtPeriodEnd(subscription),
    });

    const licenseIds = await this.mintOrExtendLicenses({
      userSubscriptionId: userSubscription.id,
      userId,
      gameIds: plan.games.map((entry) => entry.gameId),
      validFrom: period.currentPeriodStart,
      expiresAt: period.currentPeriodEnd,
      buyerEmail,
    });

    return {
      action: 'subscription_fulfilled',
      subscriptionId: userSubscription.id,
      licenseIds,
    };
  }

  async handleSubscriptionUpdated(
    subscription: SubscriptionLike,
  ): Promise<SubscriptionFulfillmentResult> {
    const providerSubscriptionId = subscription.id;
    const userSubscription =
      await this.userSubscriptions.findByProviderSubscriptionId(providerSubscriptionId);
    if (!userSubscription) {
      return { action: 'ignored' };
    }

    const period = this.readSubscriptionPeriod(subscription);

    await this.userSubscriptions.update(userSubscription.id, {
      status: subscription.status,
      currentPeriodStart: period.currentPeriodStart,
      currentPeriodEnd: period.currentPeriodEnd,
      cancelAtPeriodEnd: isCancelAtPeriodEnd(subscription),
    });

    const licenseIds = await this.extendSubscriptionLicenses(
      userSubscription.id,
      period.currentPeriodEnd,
    );

    return {
      action: subscription.status === 'canceled' ? 'subscription_ended' : 'subscription_synced',
      subscriptionId: userSubscription.id,
      licenseIds,
    };
  }

  async handleSubscriptionCanceled(
    subscription: SubscriptionLike,
  ): Promise<SubscriptionFulfillmentResult> {
    return this.handleSubscriptionUpdated(subscription);
  }

  async handleTransactionCompletedForSubscription(
    transaction: TransactionLike,
  ): Promise<SubscriptionFulfillmentResult> {
    const providerSubscriptionId = transaction.subscriptionId;
    if (!providerSubscriptionId) {
      return { action: 'ignored' };
    }

    try {
      const subscription = await this.paddle.retrieveSubscription(providerSubscriptionId);

      const userSubscription =
        await this.userSubscriptions.findByProviderSubscriptionId(providerSubscriptionId);
      if (userSubscription) {
        return this.handleSubscriptionUpdated(subscription);
      }

      return this.handleSubscriptionActivated(subscription);
    } catch (error) {
      this.logger.warn(
        `Could not fetch Paddle subscription ${providerSubscriptionId} for transaction ${transaction.id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return { action: 'ignored' };
    }
  }

  private async mintOrExtendLicenses(params: {
    userSubscriptionId: string;
    userId: string;
    gameIds: string[];
    validFrom: Date;
    expiresAt: Date;
    buyerEmail?: string;
  }): Promise<string[]> {
    const licenseIds: string[] = [];

    for (const gameId of params.gameIds) {
      const license = await this.upsertSubscriptionLicense({
        userSubscriptionId: params.userSubscriptionId,
        userId: params.userId,
        gameId,
        validFrom: params.validFrom,
        expiresAt: params.expiresAt,
        buyerEmail: params.buyerEmail,
      });
      licenseIds.push(license.id);
    }

    return licenseIds;
  }

  private async extendSubscriptionLicenses(
    userSubscriptionId: string,
    expiresAt: Date,
  ): Promise<string[]> {
    const licenses = await this.prisma.license.findMany({
      where: { subscriptionId: userSubscriptionId },
      select: { id: true },
    });

    if (licenses.length === 0) {
      return [];
    }

    await this.prisma.license.updateMany({
      where: { subscriptionId: userSubscriptionId },
      data: { expiresAt },
    });

    return licenses.map((license) => license.id);
  }

  private async upsertSubscriptionLicense(params: {
    userSubscriptionId: string;
    userId: string;
    gameId: string;
    validFrom: Date;
    expiresAt: Date;
    buyerEmail?: string;
  }) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          const existing = await tx.license.findUnique({
            where: {
              subscription_game_owner: {
                subscriptionId: params.userSubscriptionId,
                gameId: params.gameId,
                ownerId: params.userId,
              },
            },
            select: { id: true, accountId: true },
          });

          if (existing) {
            return tx.license.update({
              where: { id: existing.id },
              data: {
                expiresAt: params.expiresAt,
                validFrom: params.validFrom,
                buyerEmail: params.buyerEmail,
              },
            });
          }

          const claimed = await this.gameAccounts.claimSeatForGame(
            params.gameId,
            undefined,
            tx,
          );
          if (!claimed) {
            throw new Error(
              `No pool account capacity for subscription game ${params.gameId}`,
            );
          }

          const license = await tx.license.create({
            data: {
              licenseKey: generateLicenseKey(),
              status: 'available',
              source: 'subscription',
              validFrom: params.validFrom,
              expiresAt: params.expiresAt,
              buyerEmail: params.buyerEmail,
              game: { connect: { id: params.gameId } },
              account: { connect: { id: claimed.id } },
              owner: { connect: { id: params.userId } },
              subscription: { connect: { id: params.userSubscriptionId } },
            },
          });

          await this.gameAccounts.advanceNextAccountIfFull(params.gameId, tx);
          return license;
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

    throw new Error('Failed to mint subscription license');
  }

  private readSubscriptionPeriod(subscription: SubscriptionLike): {
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  } {
    const period =
      'currentBillingPeriod' in subscription
        ? subscription.currentBillingPeriod
        : null;

    if (!period) {
      throw new Error(
        `Paddle subscription ${subscription.id} has no current billing period`,
      );
    }

    return parseBillingPeriod(period);
  }
}
