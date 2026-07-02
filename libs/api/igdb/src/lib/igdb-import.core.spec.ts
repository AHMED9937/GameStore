import { describe, expect, it, vi } from 'vitest';
import type { IgdbClient } from './igdb-client';
import { importIgdbGame } from './igdb-import.core';

describe('importIgdbGame', () => {
  it('creates a draft game with screenshots and videos', async () => {
    const client = {
      getGameDetails: vi.fn().mockResolvedValue({
        igdbId: 12345,
        title: 'Halo',
        summary: 'Classic shooter.',
        releaseDate: new Date('2001-11-15T00:00:00.000Z'),
        genres: ['Shooter'],
        coverUrl: 'https://images.igdb.com/cover.jpg',
      }),
      getScreenshots: vi.fn().mockResolvedValue([
        { igdbId: 1, url: 'https://images.igdb.com/s1.jpg' },
        { igdbId: 2, url: 'https://images.igdb.com/s2.jpg' },
      ]),
      getVideos: vi.fn().mockResolvedValue([
        { igdbId: 3, title: 'Trailer', url: 'https://www.youtube.com/embed/vid1' },
        { igdbId: 4, title: 'Gameplay', url: 'https://www.youtube.com/embed/vid2' },
      ]),
    } satisfies Pick<IgdbClient, 'getGameDetails' | 'getScreenshots' | 'getVideos'>;

    const createMany = vi.fn().mockResolvedValue({ count: 4 });
    const deleteMany = vi.fn().mockResolvedValue({ count: 0 });
    const create = vi.fn().mockResolvedValue({
      id: 'game-1',
      slug: 'halo',
      title: 'Halo',
      igdbId: 12345,
      platform: 'steam',
      priceBase: { toString: () => '9.99' },
      publishedAt: null,
    });

    const prisma = {
      game: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null),
      },
      $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) =>
        callback({
          game: {
            findUnique: vi.fn().mockResolvedValue(null),
            create,
            update: vi.fn(),
          },
          gameMedia: {
            deleteMany,
            createMany,
          },
        }),
      ),
    };

    const result = await importIgdbGame(prisma as never, client as never, {
      igdbId: 12345,
      priceBase: 9.99,
      platform: 'steam',
    });

    expect(result).toEqual({
      id: 'game-1',
      slug: 'halo',
      title: 'Halo',
      igdbId: 12345,
      platform: 'steam',
      priceBase: '9.99',
      publishedAt: null,
    });
    expect(createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ type: 'screenshot', sortOrder: 0 }),
        expect.objectContaining({ type: 'screenshot', sortOrder: 1 }),
        expect.objectContaining({ type: 'video', sortOrder: 0 }),
        expect.objectContaining({ type: 'video', sortOrder: 1 }),
      ]),
    });
  });
});
