import { Injectable } from '@nestjs/common';
import { SubscriptionPlansRepository } from '@gamestore/api/data-access';

export type PublicSubscriptionPlanGameDto = {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
};

export type PublicSubscriptionPlanDto = {
  id: string;
  name: string;
  slug: string;
  interval: string;
  intervalCount: number;
  games: PublicSubscriptionPlanGameDto[];
};

@Injectable()
export class SubscriptionPlansService {
  constructor(private readonly plans: SubscriptionPlansRepository) {}

  async findPublic(): Promise<PublicSubscriptionPlanDto[]> {
    const rows = await this.plans.findActive();

    return rows
      .map((plan) => ({
        id: plan.id,
        name: plan.name,
        slug: plan.slug,
        interval: plan.interval,
        intervalCount: plan.intervalCount,
        games: plan.games
          .map((entry) => entry.game)
          .filter((game) => game.publishedAt != null)
          .map((game) => ({
            id: game.id,
            title: game.title,
            slug: game.slug,
            coverImage: game.coverImage,
          })),
      }))
      .filter((plan) => plan.games.length > 0);
  }
}
