import { describe, expect, it, vi } from 'vitest';
import type { UserSubscriptionsRepository } from '@gamestore/api/data-access';
import { SubscriptionsService } from './subscriptions.service';

describe('SubscriptionsService', () => {
  it('findMine maps user subscriptions with licenses', async () => {
    const userSubscriptions = {
      findByUserId: vi.fn().mockResolvedValue([
        {
          id: 'user-sub-1',
          status: 'active',
          currentPeriodStart: new Date('2026-01-01T00:00:00.000Z'),
          currentPeriodEnd: new Date('2026-02-01T00:00:00.000Z'),
          cancelAtPeriodEnd: false,
          plan: {
            id: 'plan-1',
            name: 'All Access',
            slug: 'all-access-monthly',
            interval: 'month',
            intervalCount: 1,
          },
          licenses: [
            {
              id: 'lic-1',
              licenseKey: 'GS-ABCD-EF12-3456',
              status: 'available',
              expiresAt: new Date('2026-02-01T00:00:00.000Z'),
              game: {
                id: 'game-1',
                title: 'Demo Game',
                slug: 'demo-game-1',
                coverImage: null,
              },
            },
          ],
        },
      ]),
    } satisfies Pick<UserSubscriptionsRepository, 'findByUserId'>;

    const service = new SubscriptionsService(
      userSubscriptions as unknown as UserSubscriptionsRepository,
    );

    await expect(service.findMine('user-1')).resolves.toEqual([
      {
        id: 'user-sub-1',
        status: 'active',
        currentPeriodStart: '2026-01-01T00:00:00.000Z',
        currentPeriodEnd: '2026-02-01T00:00:00.000Z',
        cancelAtPeriodEnd: false,
        plan: {
          id: 'plan-1',
          name: 'All Access',
          slug: 'all-access-monthly',
          interval: 'month',
          intervalCount: 1,
        },
        licenses: [
          {
            id: 'lic-1',
            licenseKey: 'GS-ABCD-EF12-3456',
            status: 'available',
            expiresAt: '2026-02-01T00:00:00.000Z',
            game: {
              id: 'game-1',
              title: 'Demo Game',
              slug: 'demo-game-1',
              coverImage: null,
            },
          },
        ],
      },
    ]);
  });
});
