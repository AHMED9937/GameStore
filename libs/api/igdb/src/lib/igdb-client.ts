import { IgdbConfig } from './igdb.config';
import {
  IGDB_COVER_CARD_SIZE,
  IGDB_SCREENSHOT_SIZE,
  normalizeIgdbImageUrl,
  resolveIgdbCoverUrls,
  upgradeIgdbImageUrl,
} from './igdb-image-url';
import type {
  IgdbGameDetails,
  IgdbScreenshot,
  IgdbSearchResult,
  IgdbVideo,
} from './igdb.types';
import { IGDB_API_PAGE_SIZE } from './igdb-media.constants';
import {
  extractYoutubeVideoId,
  toYoutubeEmbedFromIgdbVideoId,
} from './igdb-youtube';

export type FetchFn = typeof fetch;

export class IgdbClientError extends Error {
  readonly status: number;
  readonly kind: 'auth' | 'upstream' | 'client';

  constructor(message: string, status: number, kind: IgdbClientError['kind']) {
    super(message);
    this.name = 'IgdbClientError';
    this.status = status;
    this.kind = kind;
  }
}

let fetchImpl: FetchFn = globalThis.fetch.bind(globalThis);

export function setIgdbFetchForTests(fetchFn: FetchFn): void {
  fetchImpl = fetchFn;
}

export function resetIgdbFetchForTests(): void {
  fetchImpl = globalThis.fetch.bind(globalThis);
}

type IgdbCover = { url?: string };
type IgdbGameRow = {
  id: number;
  name?: string;
  summary?: string;
  first_release_date?: number;
  genres?: Array<{ name?: string }>;
  cover?: IgdbCover;
};
type IgdbScreenshotRow = { id?: number; url?: string };
type IgdbVideoRow = { id?: number; name?: string; video_id?: string };
type IgdbMediaScopeRow = { id: number; version_parent?: number; parent_game?: number };
type IgdbRowWithId = { id?: number };

export class IgdbClient {
  private token: string | null = null;
  private tokenExpiresAt = 0;

  constructor(private readonly fetchFn: FetchFn = fetchImpl) {}

  async searchGames(query: string): Promise<IgdbSearchResult[]> {
    const trimmed = query.trim();
    if (!trimmed) {
      return [];
    }

    const escaped = trimmed.replace(/"/g, '\\"');
    const rows = await this.post<IgdbGameRow[]>(
      '/games',
      `search "${escaped}"; fields id,name,first_release_date,cover.url; limit 20;`,
    );

    return rows.map((row) => ({
      igdbId: row.id,
      title: row.name ?? `Game ${row.id}`,
      releaseDate: unixToIsoDate(row.first_release_date),
      coverUrl: toSearchCoverUrl(row.cover?.url),
    }));
  }

  async getGameDetails(igdbId: number): Promise<IgdbGameDetails | null> {
    const rows = await this.post<IgdbGameRow[]>(
      '/games',
      `fields id,name,summary,first_release_date,genres.name,cover.url; where id = ${igdbId};`,
    );
    const row = rows[0];
    if (!row) {
      return null;
    }

    const covers = resolveIgdbCoverUrls(row.cover?.url);

    return {
      igdbId: row.id,
      title: row.name ?? `Game ${row.id}`,
      summary: row.summary ?? null,
      releaseDate: unixToDate(row.first_release_date),
      genres: (row.genres ?? [])
        .map((genre) => genre.name)
        .filter((name): name is string => Boolean(name)),
      coverUrl: covers.coverUrl,
      coverCardUrl: covers.coverCardUrl,
      coverSourceUrl: covers.coverSourceUrl,
    };
  }

  async getGameMedia(igdbId: number): Promise<{
    screenshots: IgdbScreenshot[];
    videos: IgdbVideo[];
  }> {
    const gameIds = await this.resolveMediaGameIds(igdbId);
    const [screenshots, videos] = await Promise.all([
      this.collectScreenshots(gameIds),
      this.collectVideos(gameIds),
    ]);
    return { screenshots, videos };
  }

  async getScreenshots(igdbId: number): Promise<IgdbScreenshot[]> {
    const gameIds = await this.resolveMediaGameIds(igdbId);
    return this.collectScreenshots(gameIds);
  }

  async getVideos(igdbId: number): Promise<IgdbVideo[]> {
    const gameIds = await this.resolveMediaGameIds(igdbId);
    return this.collectVideos(gameIds);
  }

  private async resolveMediaGameIds(igdbId: number): Promise<number[]> {
    const rows = await this.post<IgdbMediaScopeRow[]>(
      '/games',
      `fields id,version_parent,parent_game; where id = ${igdbId};`,
    );
    const row = rows[0];
    if (!row) {
      return [igdbId];
    }

    const ids = [igdbId];
    for (const relatedId of [row.version_parent, row.parent_game]) {
      if (relatedId && relatedId !== igdbId && !ids.includes(relatedId)) {
        ids.push(relatedId);
      }
    }
    return ids;
  }

  private async collectScreenshots(gameIds: number[]): Promise<IgdbScreenshot[]> {
    const seenScreenshotIds = new Set<number>();
    const screenshots: IgdbScreenshot[] = [];

    for (const gameId of gameIds) {
      const rows = await this.fetchAllIgdbRows<IgdbScreenshotRow>(
        '/screenshots',
        `fields id,url; where game = ${gameId};`,
      );

      for (const row of rows) {
        if (row.id !== undefined && seenScreenshotIds.has(row.id)) {
          continue;
        }
        const url = toScreenshotUrl(row.url);
        if (!url) {
          continue;
        }
        if (row.id !== undefined) {
          seenScreenshotIds.add(row.id);
        }
        screenshots.push({ igdbId: row.id ?? null, url });
      }
    }

    return screenshots;
  }

  private async collectVideos(gameIds: number[]): Promise<IgdbVideo[]> {
    const seenYoutubeIds = new Set<string>();
    const seenIgdbIds = new Set<number>();
    const videos: IgdbVideo[] = [];

    for (const gameId of gameIds) {
      const rows = await this.fetchAllIgdbRows<IgdbVideoRow>(
        '/game_videos',
        `fields id,name,video_id; where game = ${gameId};`,
      );

      for (const row of rows) {
        if (row.id !== undefined && seenIgdbIds.has(row.id)) {
          continue;
        }
        const url = toYoutubeEmbedFromIgdbVideoId(row.video_id);
        if (!url) {
          continue;
        }
        const youtubeId = extractYoutubeVideoId(url);
        if (youtubeId && seenYoutubeIds.has(youtubeId)) {
          continue;
        }
        if (row.id !== undefined) {
          seenIgdbIds.add(row.id);
        }
        if (youtubeId) {
          seenYoutubeIds.add(youtubeId);
        }
        videos.push({
          igdbId: row.id ?? null,
          title: row.name ?? null,
          url,
        });
      }
    }

    return videos;
  }

  private async fetchAllIgdbRows<T extends IgdbRowWithId>(
    path: string,
    baseQuery: string,
  ): Promise<T[]> {
    const results: T[] = [];
    const seenIds = new Set<number>();
    let offset = 0;

    while (true) {
      const page = await this.post<T[]>(
        path,
        `${baseQuery} sort id asc; limit ${IGDB_API_PAGE_SIZE}; offset ${offset};`,
      );

      if (page.length === 0) {
        break;
      }

      for (const row of page) {
        if (row.id !== undefined) {
          if (seenIds.has(row.id)) {
            continue;
          }
          seenIds.add(row.id);
        }
        results.push(row);
      }

      if (page.length < IGDB_API_PAGE_SIZE) {
        break;
      }
      offset += IGDB_API_PAGE_SIZE;
    }

    return results;
  }

  private async post<T>(path: string, body: string): Promise<T> {
    const token = await this.getAccessToken();
    const clientId = IgdbConfig.clientId();
    if (!clientId) {
      throw new Error('IGDB_CLIENT_ID is not configured');
    }

    const response = await this.fetchFn(`${IgdbConfig.apiBaseUrl()}${path}`, {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'text/plain',
      },
      body,
    });

    if (!response.ok) {
      const text = await response.text();
      throw mapIgdbHttpError(path, response.status, text);
    }

    return (await response.json()) as T;
  }

  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.token && now < this.tokenExpiresAt) {
      return this.token;
    }

    const clientId = IgdbConfig.clientId();
    const clientSecret = IgdbConfig.clientSecret();
    if (!clientId || !clientSecret) {
      throw new Error('IGDB credentials are not configured');
    }

    const url = new URL(IgdbConfig.tokenUrl());
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('client_secret', clientSecret);
    url.searchParams.set('grant_type', 'client_credentials');

    const response = await this.fetchFn(url.toString(), { method: 'POST' });
    if (!response.ok) {
      const text = await response.text();
      throw mapIgdbHttpError('oauth', response.status, text);
    }

    const payload = (await response.json()) as {
      access_token?: string;
      expires_in?: number;
    };
    if (!payload.access_token) {
      throw new Error('IGDB OAuth response missing access_token');
    }

    this.token = payload.access_token;
    const expiresInMs = (payload.expires_in ?? 3600) * 1000;
    this.tokenExpiresAt = now + expiresInMs - 60_000;
    return this.token;
  }
}

function unixToDate(seconds?: number): Date | null {
  if (!seconds) {
    return null;
  }
  return new Date(seconds * 1000);
}

function unixToIsoDate(seconds?: number): string | null {
  const date = unixToDate(seconds);
  return date ? date.toISOString().slice(0, 10) : null;
}

function toSearchCoverUrl(url?: string): string | null {
  const upgraded = upgradeIgdbImageUrl(normalizeIgdbImageUrl(url), IGDB_COVER_CARD_SIZE);
  return upgraded || null;
}

function toScreenshotUrl(url?: string): string {
  return upgradeIgdbImageUrl(normalizeIgdbImageUrl(url), IGDB_SCREENSHOT_SIZE);
}

function mapIgdbHttpError(path: string, status: number, body: string): IgdbClientError {
  const safeDetail = body.trim().slice(0, 200) || 'upstream error';
  if (status === 401 || status === 403) {
    return new IgdbClientError(
      'IGDB authentication failed. Check IGDB_CLIENT_ID and IGDB_CLIENT_SECRET.',
      status,
      'auth',
    );
  }
  if (status === 429 || status >= 500) {
    return new IgdbClientError(
      `IGDB ${path} is temporarily unavailable (${status}). Try again shortly.`,
      status,
      'upstream',
    );
  }
  return new IgdbClientError(
    `IGDB ${path} request failed (${status}): ${safeDetail}`,
    status,
    'client',
  );
}
