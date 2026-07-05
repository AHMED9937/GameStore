import { describe, expect, it, vi } from 'vitest';
import type { IgdbClient } from './igdb-client';
import { importIgdbGame } from './igdb-import.core';

describe('importIgdbGame', () => {
  it('creates a draft game with all screenshots and videos from IGDB', async () => {
    const screenshots = Array.from({ length: 5 }, (_, index) => ({
      igdbId: index + 1,
      url: `https://images.igdb.com/s${index + 1}.jpg`,
    }));
    const videos = [
      { igdbId: 101, title: 'Announcement Trailer', url: 'https://www.youtube.com/embed/vid1' },
      { igdbId: 102, title: 'Release Trailer', url: 'https://www.youtube.com/embed/vid2' },
      { igdbId: 103, title: 'Launch Trailer', url: 'https://www.youtube.com/embed/vid3' },
      { igdbId: 104, title: 'Gameplay', url: 'https://www.youtube.com/embed/vid4' },
    ];

    const client = {
      getGameDetails: vi.fn().mockResolvedValue({
        igdbId: 12345,
        title: 'Halo',
        summary: 'Classic shooter.',
        releaseDate: new Date('2001-11-15T00:00:00.000Z'),
        genres: ['Shooter'],
        coverUrl: 'https://images.igdb.com/igdb/image/upload/t_1080p_2x/cover.jpg',
        coverCardUrl: 'https://images.igdb.com/igdb/image/upload/t_1080p/cover.jpg',
        coverSourceUrl: 'https://images.igdb.com/igdb/image/upload/t_thumb/cover.jpg',
      }),
      getGameMedia: vi.fn().mockResolvedValue({ screenshots, videos }),
      getScreenshots: vi.fn().mockResolvedValue(screenshots),
      getVideos: vi.fn().mockResolvedValue(videos),
    } satisfies Pick<IgdbClient, 'getGameDetails' | 'getGameMedia' | 'getScreenshots' | 'getVideos'>;

    const createMany = vi.fn().mockResolvedValue({ count: 9 });
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
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        coverImage: 'https://images.igdb.com/igdb/image/upload/t_1080p_2x/cover.jpg',
        coverCardImage: 'https://images.igdb.com/igdb/image/upload/t_1080p/cover.jpg',
        igdbCoverUrl: 'https://images.igdb.com/igdb/image/upload/t_thumb/cover.jpg',
      }),
    });
    expect(createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ type: 'screenshot', sortOrder: 0, igdbId: 1 }),
        expect.objectContaining({ type: 'screenshot', sortOrder: 4, igdbId: 5 }),
        expect.objectContaining({ type: 'video', sortOrder: 5, igdbId: 101, title: 'Announcement Trailer' }),
        expect.objectContaining({ type: 'video', sortOrder: 8, igdbId: 104, title: 'Gameplay' }),
      ]),
    });
    expect(createMany.mock.calls[0]?.[0]?.data).toHaveLength(9);
  });
});
