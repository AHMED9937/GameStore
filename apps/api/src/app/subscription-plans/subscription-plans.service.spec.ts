import { describe, expect, it, vi } from 'vitest';
import type { SubscriptionPlansRepository } from '@gamestore/api/data-access';
import { SubscriptionPlansService } from './subscription-plans.service';

describe('SubscriptionPlansService', () => {
  it('findPublic returns active plans with published games only', async () => {
    const plans = {
      findActive: vi.fn().mockResolvedValue([
        {
          id: 'plan-1',
          name: 'All Access',
          slug: 'all-access-monthly',
          interval: 'month',
          intervalCount: 1,
          games: [
            {
              game: {
                id: 'game-1',
                title: 'Demo Game',
                slug: 'demo-game-1',
                coverImage: null,
                publishedAt: new Date('2026-01-01'),
              },
            },
            {
              game: {
                id: 'game-2',
                title: 'Draft Game',
                slug: 'draft-game',
                coverImage: null,
                publishedAt: null,
              },
            },
          ],
        },
        {
          id: 'plan-2',
          name: 'Empty Plan',
          slug: 'empty-plan',
          interval: 'year',
          intervalCount: 1,
          games: [],
        },
      ]),
    } satisfies Pick<SubscriptionPlansRepository, 'findActive'>;

    const service = new SubscriptionPlansService(
      plans as unknown as SubscriptionPlansRepository,
    );

    await expect(service.findPublic()).resolves.toEqual([
      {
        id: 'plan-1',
        name: 'All Access',
        slug: 'all-access-monthly',
        interval: 'month',
        intervalCount: 1,
        games: [
          {
            id: 'game-1',
            title: 'Demo Game',
            slug: 'demo-game-1',
            coverImage: null,
          },
        ],
      },
    ]);
  });
});
