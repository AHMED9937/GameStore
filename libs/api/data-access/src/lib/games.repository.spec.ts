import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '@gamestore/api/prisma';
import { GamesRepository, catalogGameSelect } from './games.repository';

function createPrismaMock() {
  return {
    game: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 'new' }),
      update: vi.fn().mockResolvedValue({ id: 'updated' }),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      delete: vi.fn().mockResolvedValue({ id: 'deleted' }),
    },
    $transaction: vi.fn((ops: unknown[]) => Promise.all(ops)),
  };
}

describe('GamesRepository', () => {
  it('findPublished Filters by publishedAt and orders by title', async () => {
    const prisma = createPrismaMock();
    const repo = new GamesRepository(prisma as unknown as PrismaService);

    await repo.findPublished();

    expect(prisma.game.findMany).toHaveBeenCalledWith({
      where: { publishedAt: { not: null } },
      orderBy: { title: 'asc' },
      select: catalogGameSelect,
    });
  });

  it('findBySlug looks up a published slug with media', async () => {
    const prisma = createPrismaMock();
    prisma.game.findFirst = vi.fn().mockResolvedValue(null);
    const repo = new GamesRepository(prisma as unknown as PrismaService);

    await repo.findBySlug('demo-game-1');

    expect(prisma.game.findFirst).toHaveBeenCalledWith({
      where: { slug: 'demo-game-1', publishedAt: { not: null } },
      include: {
        media: {
          orderBy: { sortOrder: 'asc' },
          where: { type: { in: ['screenshot', 'video', 'activation'] } },
        },
        discount: { select: expect.any(Object) },
      },
    });
  });

  it('findById includes discount relation', async () => {
    const prisma = createPrismaMock();
    const repo = new GamesRepository(prisma as unknown as PrismaService);

    await repo.findById('game-1');

    expect(prisma.game.findUnique).toHaveBeenCalledWith({
      where: { id: 'game-1' },
      include: {
        discount: { select: expect.any(Object) },
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
      where: {},
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

  it('findAllAdmin applies search and status filters', async () => {
    const prisma = createPrismaMock();
    const repo = new GamesRepository(prisma as unknown as PrismaService);

    await repo.findAllAdmin({
      q: 'demo',
      platform: 'steam',
      status: 'published',
    });

    expect(prisma.game.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { title: { contains: 'demo', mode: 'insensitive' } },
          { slug: { contains: 'demo', mode: 'insensitive' } },
        ],
        platform: { equals: 'steam', mode: 'insensitive' },
        publishedAt: { not: null },
        soldOut: false,
      },
      orderBy: { title: 'asc' },
      select: expect.any(Object),
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
        featuredOrder: true,
      }),
    });
  });

  it('findFeaturedPublished returns curated games when present', async () => {
    const prisma = createPrismaMock();
    const curated = [{ id: 'featured-1' }];
    prisma.game.findMany = vi
      .fn()
      .mockResolvedValueOnce(curated)
      .mockResolvedValueOnce([]);
    const repo = new GamesRepository(prisma as unknown as PrismaService);

    const result = await repo.findFeaturedPublished(5);

    expect(result).toEqual(curated);
    expect(prisma.game.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.game.findMany).toHaveBeenCalledWith({
      where: {
        publishedAt: { not: null },
        featuredOrder: { not: null },
      },
      orderBy: { featuredOrder: 'asc' },
      take: 5,
      select: catalogGameSelect,
    });
  });

  it('findFeaturedPublished falls back to latest releases when none curated', async () => {
    const prisma = createPrismaMock();
    const fallback = [{ id: 'latest-1' }];
    prisma.game.findMany = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(fallback);
    const repo = new GamesRepository(prisma as unknown as PrismaService);

    const result = await repo.findFeaturedPublished(5);

    expect(result).toEqual(fallback);
    expect(prisma.game.findMany).toHaveBeenNthCalledWith(2, {
      where: { publishedAt: { not: null } },
      orderBy: [{ releaseDate: 'desc' }, { createdAt: 'desc' }],
      take: 5,
      select: catalogGameSelect,
    });
  });

  it('setFeaturedOrder clears existing featured rows then assigns new order', async () => {
    const prisma = createPrismaMock();
    const repo = new GamesRepository(prisma as unknown as PrismaService);

    await repo.setFeaturedOrder([
      { id: 'g1', featuredOrder: 1 },
      { id: 'g2', featuredOrder: 2 },
    ]);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.game.updateMany).toHaveBeenCalledWith({
      where: { featuredOrder: { not: null } },
      data: { featuredOrder: null },
    });
    expect(prisma.game.update).toHaveBeenCalledTimes(2);
  });
});
