import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IGDB_API_PAGE_SIZE } from './igdb-media.constants';
import { IgdbConfig } from './igdb.config';
import { IgdbClient, resetIgdbFetchForTests, setIgdbFetchForTests } from './igdb-client';

function oauthResponse() {
  return { ok: true, json: async () => ({ access_token: 'token-123', expires_in: 3600 }) };
}

function screenshotRow(id: number) {
  return {
    id,
    url: `//images.igdb.com/igdb/image/upload/t_screenshot/sc${id}.jpg`,
  };
}

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
            cover: { url: '//images.igdb.com/igdb/image/upload/t_thumb/co1.jpg' },
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
        coverUrl: 'https://images.igdb.com/igdb/image/upload/t_1080p/co1.jpg',
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
            cover: { url: '//images.igdb.com/igdb/image/upload/t_thumb/co9.jpg' },
          },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 99 }],
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
        json: async () => [{ id: 99 }],
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
      coverUrl: 'https://images.igdb.com/igdb/image/upload/t_1080p_2x/co9.jpg',
      coverCardUrl: 'https://images.igdb.com/igdb/image/upload/t_1080p/co9.jpg',
      coverSourceUrl: 'https://images.igdb.com/igdb/image/upload/t_thumb/co9.jpg',
    });

    await expect(client.getScreenshots(99)).resolves.toEqual([
      {
        igdbId: 501,
        url: 'https://images.igdb.com/igdb/image/upload/t_screenshot_huge_2x/sc1.jpg',
      },
      {
        igdbId: 502,
        url: 'https://images.igdb.com/igdb/image/upload/t_screenshot_huge_2x/sc2.jpg',
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

    const screenshotBody = fetchMock.mock.calls[3]?.[1]?.body as string;
    expect(screenshotBody).toContain('sort id asc');
    expect(screenshotBody).toContain(`limit ${IGDB_API_PAGE_SIZE}`);
    expect(screenshotBody).toContain('offset 0');

    const videoBody = fetchMock.mock.calls[5]?.[1]?.body as string;
    expect(videoBody).toContain('sort id asc');
    expect(videoBody).toContain(`limit ${IGDB_API_PAGE_SIZE}`);
    expect(videoBody).toContain('offset 0');
  });

  it('paginates screenshots across multiple IGDB pages', async () => {
    const firstPage = Array.from({ length: IGDB_API_PAGE_SIZE }, (_, index) =>
      screenshotRow(index + 1),
    );
    const secondPage = [screenshotRow(501), screenshotRow(502), screenshotRow(503)];

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(oauthResponse())
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 99 }],
      })
      .mockResolvedValueOnce({ ok: true, json: async () => firstPage })
      .mockResolvedValueOnce({ ok: true, json: async () => secondPage });

    setIgdbFetchForTests(fetchMock);
    const client = new IgdbClient();

    const screenshots = await client.getScreenshots(99);
    expect(screenshots).toHaveLength(503);
    expect(screenshots[0]?.igdbId).toBe(1);
    expect(screenshots.at(-1)?.igdbId).toBe(503);

    const firstBody = fetchMock.mock.calls[2]?.[1]?.body as string;
    const secondBody = fetchMock.mock.calls[3]?.[1]?.body as string;
    expect(firstBody).toContain(`limit ${IGDB_API_PAGE_SIZE}`);
    expect(firstBody).toContain('offset 0');
    expect(secondBody).toContain(`limit ${IGDB_API_PAGE_SIZE}`);
    expect(secondBody).toContain(`offset ${IGDB_API_PAGE_SIZE}`);
  });

  it('returns all game videos from IGDB without a low cap', async () => {
    const videos = [
      { id: 1, name: 'Announcement Trailer', video_id: 'dQw4w9WgXc1' },
      { id: 2, name: 'Release Trailer', video_id: 'dQw4w9WgXc2' },
      { id: 3, name: 'Launch Trailer', video_id: 'dQw4w9WgXc3' },
      { id: 4, name: 'Gameplay', video_id: 'dQw4w9WgXc4' },
      { id: 5, name: 'Story Trailer', video_id: 'dQw4w9WgXc5' },
    ];

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(oauthResponse())
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 42 }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => videos,
      });

    setIgdbFetchForTests(fetchMock);
    const client = new IgdbClient();

    await expect(client.getVideos(42)).resolves.toEqual([
      { igdbId: 1, title: 'Announcement Trailer', url: 'https://www.youtube.com/embed/dQw4w9WgXc1' },
      { igdbId: 2, title: 'Release Trailer', url: 'https://www.youtube.com/embed/dQw4w9WgXc2' },
      { igdbId: 3, title: 'Launch Trailer', url: 'https://www.youtube.com/embed/dQw4w9WgXc3' },
      { igdbId: 4, title: 'Gameplay', url: 'https://www.youtube.com/embed/dQw4w9WgXc4' },
      { igdbId: 5, title: 'Story Trailer', url: 'https://www.youtube.com/embed/dQw4w9WgXc5' },
    ]);
  });

  it('merges trailers from version_parent when importing an edition game', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(oauthResponse())
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 200, version_parent: 100 }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 301, name: 'Edition Trailer', video_id: 'dQw4w9WgXc1' }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 302, name: 'Launch Trailer', video_id: 'dQw4w9WgXc2' },
          { id: 303, name: 'Gameplay', video_id: 'dQw4w9WgXc3' },
        ],
      });

    setIgdbFetchForTests(fetchMock);
    const client = new IgdbClient();

    await expect(client.getVideos(200)).resolves.toEqual([
      { igdbId: 301, title: 'Edition Trailer', url: 'https://www.youtube.com/embed/dQw4w9WgXc1' },
      { igdbId: 302, title: 'Launch Trailer', url: 'https://www.youtube.com/embed/dQw4w9WgXc2' },
      { igdbId: 303, title: 'Gameplay', url: 'https://www.youtube.com/embed/dQw4w9WgXc3' },
    ]);
  });
});
