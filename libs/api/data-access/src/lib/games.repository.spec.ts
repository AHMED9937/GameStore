import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '@gamestore/api/prisma';
import { GamesRepository } from './games.repository';

function createPrismaMock() {
  return {
    game: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 'new' }),
      update: vi.fn().mockResolvedValue({ id: 'updated' }),
      delete: vi.fn().mockResolvedValue({ id: 'deleted' }),
    },
  };
}

describe('GamesRepository', () => {
  it('findPublished filters by publishedAt and orders by title', async () => {
    const prisma = createPrismaMock();
    const repo = new GamesRepository(prisma as unknown as PrismaService);

    await repo.findPublished();

    expect(prisma.game.findMany).toHaveBeenCalledWith({
      where: { publishedAt: { not: null } },
      orderBy: { title: 'asc' },
    });
  });

  it('findBySlug looks up a unique slug', async () => {
    const prisma = createPrismaMock();
    const repo = new GamesRepository(prisma as unknown as PrismaService);

    await repo.findBySlug('demo-game-1');

    expect(prisma.game.findUnique).toHaveBeenCalledWith({
      where: { slug: 'demo-game-1' },
      include: {
        media: {
          orderBy: { sortOrder: 'asc' },
          where: { type: { in: ['screenshot', 'video'] } },
        },
      },
    });
  });

  it('create delegates to prisma.game.create', async () => {
    const prisma = createPrismaMock();
    const repo = new GamesRepository(prisma as unknown as PrismaService);
    const data = {
      title: 'Test',
      slug: 'test',
      platform: 'steam',
      priceBase: 9.99,
    };

    await repo.create(data as never);

    expect(prisma.game.create).toHaveBeenCalledWith({ data });
  });

  it('delete delegates to prisma.game.delete by id', async () => {
    const prisma = createPrismaMock();
    const repo = new GamesRepository(prisma as unknown as PrismaService);

    await repo.delete('abc');

    expect(prisma.game.delete).toHaveBeenCalledWith({ where: { id: 'abc' } });
  });

  it('findAllAdmin returns all games with admin projection', async () => {
    const prisma = createPrismaMock();
    const repo = new GamesRepository(prisma as unknown as PrismaService);

    await repo.findAllAdmin();

    expect(prisma.game.findMany).toHaveBeenCalledWith({
      orderBy: { title: 'asc' },
      select: expect.objectContaining({
        id: true,
        publishedAt: true,
        igdbId: true,
        releaseDate: true,
        genres: true,
        media: expect.objectContaining({
          orderBy: { sortOrder: 'asc' },
        }),
      }),
    });
  });

  it('findByIdAdmin looks up by id with admin projection', async () => {
    const prisma = createPrismaMock();
    const repo = new GamesRepository(prisma as unknown as PrismaService);

    await repo.findByIdAdmin('game-1');

    expect(prisma.game.findUnique).toHaveBeenCalledWith({
      where: { id: 'game-1' },
      select: expect.objectContaining({
        id: true,
        publishedAt: true,
        igdbId: true,
      }),
    });
  });
});
