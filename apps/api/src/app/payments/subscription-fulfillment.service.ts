import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type Stripe from 'stripe';
import {
  GameAccountsRepository,
  generateLicenseKey,
  SubscriptionPlansRepository,
  UserSubscriptionsRepository,
} from '@gamestore/api/data-access';
import { PrismaService } from '@gamestore/api/prisma';
import { StripeService } from '@gamestore/api/stripe';

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

@Injectable()
export class SubscriptionFulfillmentService {
  private readonly logger = new Logger(SubscriptionFulfillmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly plans: SubscriptionPlansRepository,
    private readonly userSubscriptions: UserSubscriptionsRepository,
    private readonly gameAccounts: GameAccountsRepository,
    private readonly stripe: StripeService,
  ) {}

  async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<SubscriptionFulfillmentResult> {
    if (session.mode !== 'subscription') {
      return { action: 'ignored' };
    }

    if (session.payment_status !== 'paid') {
      return { action: 'pending_payment' };
    }

    const stripeSubscriptionId = this.readStripeSubscriptionId(session);
    if (!stripeSubscriptionId) {
      return { action: 'ignored' };
    }

    const existing =
      await this.userSubscriptions.findByStripeSubscriptionId(stripeSubscriptionId);
    if (existing) {
      return {
        action: 'subscription_already_fulfilled',
        subscriptionId: existing.id,
        licenseIds: existing.licenses.map((license) => license.id),
      };
    }

    const planId = session.metadata?.planId?.trim();
    const userId = session.metadata?.userId?.trim();
    if (!planId || !userId) {
      this.logger.warn(
        `Subscription checkout session ${session.id} missing planId or userId metadata`,
      );
      return { action: 'ignored' };
    }

    const plan = await this.plans.findById(planId);
    if (!plan || !plan.isActive) {
      this.logger.warn(`Subscription plan ${planId} not found or inactive`);
      return { action: 'ignored' };
    }

    const stripeSubscription =
      await this.stripe.retrieveSubscription(stripeSubscriptionId);
    const period = this.readSubscriptionPeriod(stripeSubscription);
    const buyerEmail =
      session.customer_details?.email ?? session.customer_email ?? undefined;
    const stripeCustomerId =
      typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id;

    const userSubscription = await this.userSubscriptions.create({
      user: { connect: { id: userId } },
      plan: { connect: { id: plan.id } },
      stripeSubscriptionId,
      stripeCustomerId,
      status: stripeSubscription.status,
      currentPeriodStart: period.currentPeriodStart,
      currentPeriodEnd: period.currentPeriodEnd,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
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

  async handleInvoicePaid(
    invoice: Stripe.Invoice,
  ): Promise<SubscriptionFulfillmentResult> {
    const stripeSubscriptionId = this.readInvoiceSubscriptionId(invoice);
    if (!stripeSubscriptionId) {
      return { action: 'ignored' };
    }

    const userSubscription =
      await this.userSubscriptions.findByStripeSubscriptionId(stripeSubscriptionId);
    if (!userSubscription) {
      this.logger.warn(
        `No user subscription found for Stripe subscription ${stripeSubscriptionId}`,
      );
      return { action: 'ignored' };
    }

    const stripeSubscription =
      await this.stripe.retrieveSubscription(stripeSubscriptionId);
    const period = this.readSubscriptionPeriod(stripeSubscription);

    await this.userSubscriptions.update(userSubscription.id, {
      status: stripeSubscription.status,
      currentPeriodStart: period.currentPeriodStart,
      currentPeriodEnd: period.currentPeriodEnd,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    });

    const licenseIds = await this.extendSubscriptionLicenses(
      userSubscription.id,
      period.currentPeriodEnd,
    );

    return {
      action: 'subscription_renewed',
      subscriptionId: userSubscription.id,
      licenseIds,
    };
  }

  async handleSubscriptionUpdated(
    subscription: Stripe.Subscription,
  ): Promise<SubscriptionFulfillmentResult> {
    const stripeSubscriptionId = subscription.id;
    const userSubscription =
      await this.userSubscriptions.findByStripeSubscriptionId(stripeSubscriptionId);
    if (!userSubscription) {
      return { action: 'ignored' };
    }

    const period = this.readSubscriptionPeriod(subscription);

    await this.userSubscriptions.update(userSubscription.id, {
      status: subscription.status,
      currentPeriodStart: period.currentPeriodStart,
      currentPeriodEnd: period.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });

    const licenseIds = await this.extendSubscriptionLicenses(
      userSubscription.id,
      period.currentPeriodEnd,
    );

    return {
      action: 'subscription_synced',
      subscriptionId: userSubscription.id,
      licenseIds,
    };
  }

  async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
  ): Promise<SubscriptionFulfillmentResult> {
    const userSubscription =
      await this.userSubscriptions.findByStripeSubscriptionId(subscription.id);
    if (!userSubscription) {
      return { action: 'ignored' };
    }

    const period = this.readSubscriptionPeriod(subscription);

    await this.userSubscriptions.update(userSubscription.id, {
      status: subscription.status,
      currentPeriodStart: period.currentPeriodStart,
      currentPeriodEnd: period.currentPeriodEnd,
      cancelAtPeriodEnd: true,
    });

    const licenseIds = await this.extendSubscriptionLicenses(
      userSubscription.id,
      period.currentPeriodEnd,
    );

    return {
      action: 'subscription_ended',
      subscriptionId: userSubscription.id,
      licenseIds,
    };
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

  private readStripeSubscriptionId(
    session: Stripe.Checkout.Session,
  ): string | undefined {
    if (typeof session.subscription === 'string') {
      return session.subscription;
    }
    return session.subscription?.id;
  }

  private readInvoiceSubscriptionId(
    invoice: Stripe.Invoice,
  ): string | undefined {
    const legacy = invoice as Stripe.Invoice & {
      subscription?: string | Stripe.Subscription | null;
    };
    if (typeof legacy.subscription === 'string') {
      return legacy.subscription;
    }
    if (legacy.subscription && typeof legacy.subscription === 'object') {
      return legacy.subscription.id;
    }

    const parentSub = invoice.parent?.subscription_details?.subscription;
    if (typeof parentSub === 'string') {
      return parentSub;
    }
    return parentSub?.id;
  }

  private readSubscriptionPeriod(subscription: Stripe.Subscription): {
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  } {
    const item = subscription.items.data[0];
    const extended = subscription as Stripe.Subscription & {
      current_period_start?: number;
      current_period_end?: number;
    };
    const startSeconds =
      extended.current_period_start ?? item?.current_period_start;
    const endSeconds = extended.current_period_end ?? item?.current_period_end;

    if (!startSeconds || !endSeconds) {
      throw new Error(`Stripe subscription ${subscription.id} has no billing period`);
    }

    return {
      currentPeriodStart: new Date(startSeconds * 1000),
      currentPeriodEnd: new Date(endSeconds * 1000),
    };
  }
}
