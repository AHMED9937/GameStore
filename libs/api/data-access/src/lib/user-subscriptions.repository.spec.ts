import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '@gamestore/api/prisma';
import { UserSubscriptionsRepository } from './user-subscriptions.repository';

function createPrismaMock() {
  return {
    userSubscription: {
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({ id: 'sub-1' }),
      update: vi.fn().mockResolvedValue({ id: 'sub-1' }),
    },
  };
}

describe('UserSubscriptionsRepository', () => {
  it('findByProviderSubscriptionId loads plan games and licenses', async () => {
    const prisma = createPrismaMock();
    const repo = new UserSubscriptionsRepository(prisma as unknown as PrismaService);

    await repo.findByProviderSubscriptionId('sub_paddle_123');

    expect(prisma.userSubscription.findUnique).toHaveBeenCalledWith({
      where: { providerSubscriptionId: 'sub_paddle_123' },
      include: {
        plan: {
          include: {
            games: {
              include: {
                game: true,
              },
            },
          },
        },
        licenses: true,
      },
    });
  });

  it('findByUserId returns subscriptions ordered by createdAt desc', async () => {
    const prisma = createPrismaMock();
    const repo = new UserSubscriptionsRepository(prisma as unknown as PrismaService);

    await repo.findByUserId('user-1');

    expect(prisma.userSubscription.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: { createdAt: 'desc' },
      include: expect.objectContaining({
        plan: true,
        licenses: expect.any(Object),
      }),
    });
  });
});
