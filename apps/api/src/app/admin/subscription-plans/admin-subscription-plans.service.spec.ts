import { describe, expect, it, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { GamesRepository } from '@gamestore/api/data-access';
import type { SubscriptionPlansRepository } from '@gamestore/api/data-access';
import { AdminSubscriptionPlansService } from './admin-subscription-plans.service';

const publishedGame = {
  id: 'game-1',
  title: 'Demo Game',
  slug: 'demo-game',
  publishedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const planRecord = {
  id: 'plan-1',
  name: 'All Access',
  slug: 'all-access-monthly',
  stripePriceId: 'price_test_monthly',
  interval: 'month',
  intervalCount: 1,
  isActive: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  games: [
    {
      game: {
        id: 'game-1',
        title: 'Demo Game',
        slug: 'demo-game',
        publishedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    },
  ],
};

describe('AdminSubscriptionPlansService', () => {
  const plans = {
    findAll: vi.fn().mockResolvedValue([planRecord]),
    findById: vi.fn().mockResolvedValue(planRecord),
    create: vi.fn().mockResolvedValue({ id: 'plan-1' }),
    update: vi.fn().mockResolvedValue({ id: 'plan-1' }),
    delete: vi.fn().mockResolvedValue({ id: 'plan-1' }),
    setGames: vi.fn().mockResolvedValue(undefined),
  } satisfies Pick<
    SubscriptionPlansRepository,
    'findAll' | 'findById' | 'create' | 'update' | 'delete' | 'setGames'
  >;

  const games = {
    findById: vi.fn().mockResolvedValue(publishedGame),
  } satisfies Pick<GamesRepository, 'findById'>;

  const service = new AdminSubscriptionPlansService(
    plans as unknown as SubscriptionPlansRepository,
    games as unknown as GamesRepository,
  );

  it('findAll maps plan list items with game counts', async () => {
    await expect(service.findAll()).resolves.toEqual([
      {
        id: 'plan-1',
        name: 'All Access',
        slug: 'all-access-monthly',
        stripePriceId: 'price_test_monthly',
        interval: 'month',
        intervalCount: 1,
        isActive: true,
        gameCount: 1,
      },
    ]);
  });

  it('create links published games to the plan', async () => {
    const result = await service.create({
      name: 'All Access',
      stripePriceId: 'price_test_monthly',
      interval: 'month',
      gameIds: ['game-1'],
    });

    expect(plans.create).toHaveBeenCalled();
    expect(plans.setGames).toHaveBeenCalledWith('plan-1', ['game-1']);
    expect(result.games).toHaveLength(1);
  });

  it('create rejects unpublished games', async () => {
    games.findById.mockResolvedValueOnce({
      ...publishedGame,
      publishedAt: null,
    });

    await expect(
      service.create({
        name: 'All Access',
        stripePriceId: 'price_test_monthly',
        interval: 'month',
        gameIds: ['game-1'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('update replaces linked games when gameIds provided', async () => {
    await service.update('plan-1', { gameIds: ['game-1'] });

    expect(plans.setGames).toHaveBeenCalledWith('plan-1', ['game-1']);
  });

  it('remove deletes an existing plan', async () => {
    await expect(service.remove('plan-1')).resolves.toEqual({
      id: 'plan-1',
      deleted: true,
    });
  });

  it('findOne rejects unknown ids', async () => {
    plans.findById.mockResolvedValueOnce(null);

    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
