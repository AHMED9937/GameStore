import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IgdbConfig } from './igdb.config';
import { IgdbClient, resetIgdbFetchForTests, setIgdbFetchForTests } from './igdb-client';

describe('IgdbClient', () => {
  const originalClientId = process.env['IGDB_CLIENT_ID'];
  const originalClientSecret = process.env['IGDB_CLIENT_SECRET'];

  beforeEach(() => {
    process.env['IGDB_CLIENT_ID'] = 'test-client-id';
    process.env['IGDB_CLIENT_SECRET'] = 'test-client-secret';
    resetIgdbFetchForTests();
  });

  afterEach(() => {
    if (originalClientId === undefined) {
      delete process.env['IGDB_CLIENT_ID'];
    } else {
      process.env['IGDB_CLIENT_ID'] = originalClientId;
    }
    if (originalClientSecret === undefined) {
      delete process.env['IGDB_CLIENT_SECRET'];
    } else {
      process.env['IGDB_CLIENT_SECRET'] = originalClientSecret;
    }
    resetIgdbFetchForTests();
  });

  it('returns empty search results for blank query', async () => {
    const fetchMock = vi.fn();
    setIgdbFetchForTests(fetchMock);

    const client = new IgdbClient();
    await expect(client.searchGames('   ')).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('searches games with OAuth token and IGDB games endpoint', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'token-123', expires_in: 3600 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 42,
            name: 'Halo',
            first_release_date: Math.floor(Date.UTC(2001, 10, 15) / 1000),
            cover: { url: '//images.igdb.com/igdb/image/upload/t_cover_big/co1.jpg' },
          },
        ],
      });

    setIgdbFetchForTests(fetchMock);
    const client = new IgdbClient();

    await expect(client.searchGames('halo')).resolves.toEqual([
      {
        igdbId: 42,
        title: 'Halo',
        releaseDate: '2001-11-15',
        coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1.jpg',
      },
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toContain(IgdbConfig.tokenUrl());
    expect(fetchMock.mock.calls[1]?.[0]).toBe(`${IgdbConfig.apiBaseUrl()}/games`);
    expect(fetchMock.mock.calls[1]?.[1]?.body).toContain('search "halo"');
  });

  it('loads game details, screenshots, and videos', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'token-123', expires_in: 3600 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 99,
            name: 'Stellar Odyssey',
            summary: 'A space adventure.',
            first_release_date: Math.floor(Date.UTC(2024, 0, 15) / 1000),
            genres: [{ name: 'Adventure' }, { name: 'Sci-Fi' }],
            cover: { url: '//images.igdb.com/igdb/image/upload/t_cover_big/co9.jpg' },
          },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 501, url: '//images.igdb.com/igdb/image/upload/t_screenshot/sc1.jpg' },
          { id: 502, url: '//images.igdb.com/igdb/image/upload/t_screenshot/sc2.jpg' },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 601, name: 'Launch Trailer', video_id: 'abc123' },
          { id: 602, name: 'Gameplay', video_id: 'def456' },
        ],
      });

    setIgdbFetchForTests(fetchMock);
    const client = new IgdbClient();

    await expect(client.getGameDetails(99)).resolves.toEqual({
      igdbId: 99,
      title: 'Stellar Odyssey',
      summary: 'A space adventure.',
      releaseDate: new Date('2024-01-15T00:00:00.000Z'),
      genres: ['Adventure', 'Sci-Fi'],
      coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co9.jpg',
    });

    await expect(client.getScreenshots(99)).resolves.toEqual([
      {
        igdbId: 501,
        url: 'https://images.igdb.com/igdb/image/upload/t_screenshot/sc1.jpg',
      },
      {
        igdbId: 502,
        url: 'https://images.igdb.com/igdb/image/upload/t_screenshot/sc2.jpg',
      },
    ]);

    await expect(client.getVideos(99)).resolves.toEqual([
      {
        igdbId: 601,
        title: 'Launch Trailer',
        url: 'https://www.youtube.com/embed/abc123',
      },
      {
        igdbId: 602,
        title: 'Gameplay',
        url: 'https://www.youtube.com/embed/def456',
      },
    ]);
  });
});
