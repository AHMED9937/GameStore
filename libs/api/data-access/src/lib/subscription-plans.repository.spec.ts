import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '@gamestore/api/prisma';
import { SubscriptionPlansRepository } from './subscription-plans.repository';

function createPrismaMock() {
  return {
    subscriptionPlan: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 'plan-1' }),
      update: vi.fn().mockResolvedValue({ id: 'plan-1' }),
      delete: vi.fn().mockResolvedValue({ id: 'plan-1' }),
    },
    subscriptionPlanGame: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      create: vi.fn().mockResolvedValue({ planId: 'plan-1', gameId: 'game-1' }),
    },
    $transaction: vi.fn((ops: unknown[]) => Promise.all(ops)),
  };
}

describe('SubscriptionPlansRepository', () => {
  it('findBySlug includes plan games with game summary', async () => {
    const prisma = createPrismaMock();
    const repo = new SubscriptionPlansRepository(prisma as unknown as PrismaService);

    await repo.findBySlug('all-access-monthly');

    expect(prisma.subscriptionPlan.findUnique).toHaveBeenCalledWith({
      where: { slug: 'all-access-monthly' },
      include: {
        games: {
          include: {
            game: {
              select: {
                id: true,
                title: true,
                slug: true,
                publishedAt: true,
              },
            },
          },
        },
      },
    });
  });

  it('setGames replaces plan game links in a transaction', async () => {
    const prisma = createPrismaMock();
    const repo = new SubscriptionPlansRepository(prisma as unknown as PrismaService);

    await repo.setGames('plan-1', ['game-1', 'game-2']);

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.subscriptionPlanGame.deleteMany).toHaveBeenCalledWith({
      where: { planId: 'plan-1' },
    });
    expect(prisma.subscriptionPlanGame.create).toHaveBeenCalledTimes(2);
  });
});
