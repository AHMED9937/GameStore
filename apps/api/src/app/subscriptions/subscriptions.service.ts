import { Injectable } from '@nestjs/common';
import { UserSubscriptionsRepository, resolveLicenseExpiresAt } from '@gamestore/api/data-access';

export type UserSubscriptionLicenseDto = {
  id: string;
  licenseKey: string;
  status: string;
  validFrom: string;
  expiresAt: string;
  game: {
    id: string;
    title: string;
    slug: string;
    coverImage: string | null;
  };
};

export type UserSubscriptionDto = {
  id: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  plan: {
    id: string;
    name: string;
    slug: string;
    interval: string;
    intervalCount: number;
  };
  licenses: UserSubscriptionLicenseDto[];
};

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly userSubscriptions: UserSubscriptionsRepository,
  ) {}

  async findMine(userId: string): Promise<UserSubscriptionDto[]> {
    const rows = await this.userSubscriptions.findByUserId(userId);

    return rows.map((row) => ({
      id: row.id,
      status: row.status,
      currentPeriodStart: row.currentPeriodStart.toISOString(),
      currentPeriodEnd: row.currentPeriodEnd.toISOString(),
      cancelAtPeriodEnd: row.cancelAtPeriodEnd,
      plan: {
        id: row.plan.id,
        name: row.plan.name,
        slug: row.plan.slug,
        interval: row.plan.interval,
        intervalCount: row.plan.intervalCount,
      },
      licenses: row.licenses.map((license) => ({
        id: license.id,
        licenseKey: license.licenseKey,
        status: license.status,
        validFrom: license.validFrom.toISOString(),
        expiresAt: resolveLicenseExpiresAt(
          license.expiresAt,
          license.validFrom,
        ).toISOString(),
        game: license.game,
      })),
    }));
  }
}
