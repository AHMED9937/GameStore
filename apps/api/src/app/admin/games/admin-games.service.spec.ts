import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GamesRepository } from '@gamestore/api/data-access';
import type { PrismaService } from '@gamestore/api/prisma';
import { AdminGamesService } from './admin-games.service';

const sampleGame = {
  id: 'game-1',
  title: 'Demo Game',
  slug: 'demo-game',
  platform: 'steam',
  priceBase: { toString: () => '9.99' },
  description: 'A demo title',
  coverImage: null,
  publishedAt: new Date('2026-01-01'),
  igdbId: null,
  releaseDate: null,
  genres: [],
  requirementsMin: null,
  requirementsRecommended: null,
  media: [],
};

describe('AdminGamesService bulk actions', () => {
  const games = {
    findAllAdmin: vi.fn(),
    findByIdAdmin: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  } as unknown as GamesRepository;

  const prisma = {
    gameAccount: {
      count: vi.fn().mockResolvedValue(0),
    },
  } as unknown as PrismaService;

  let service: AdminGamesService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AdminGamesService(games, prisma);
    vi.mocked(games.findByIdAdmin).mockResolvedValue(sampleGame as never);
    vi.mocked(games.update).mockResolvedValue(sampleGame as never);
    vi.mocked(games.delete).mockResolvedValue(sampleGame as never);
  });

  it('bulkUnpublish unpublishes each game', async () => {
    await expect(service.bulkUnpublish(['game-1', 'game-2'])).resolves.toEqual({
      succeeded: ['game-1', 'game-2'],
      failed: [],
    });
    expect(games.update).toHaveBeenCalledTimes(2);
  });

  it('bulkDelete collects failures', async () => {
    vi.mocked(games.delete)
      .mockResolvedValueOnce(sampleGame as never)
      .mockRejectedValueOnce({ code: 'P2025' });

    const result = await service.bulkDelete(['game-1', 'missing']);

    expect(result.succeeded).toEqual(['game-1']);
    expect(result.failed).toHaveLength(1);
  });
});
