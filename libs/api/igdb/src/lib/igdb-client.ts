import { IgdbConfig } from './igdb.config';
import type {
  IgdbGameDetails,
  IgdbScreenshot,
  IgdbSearchResult,
  IgdbVideo,
} from './igdb.types';
import {
  IGDB_IMPORT_SCREENSHOT_LIMIT,
  IGDB_IMPORT_VIDEO_LIMIT,
} from './igdb-media.constants';

export type FetchFn = typeof fetch;

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
      coverUrl: toCoverUrl(row.cover?.url),
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

    return {
      igdbId: row.id,
      title: row.name ?? `Game ${row.id}`,
      summary: row.summary ?? null,
      releaseDate: unixToDate(row.first_release_date),
      genres: (row.genres ?? [])
        .map((genre) => genre.name)
        .filter((name): name is string => Boolean(name)),
      coverUrl: toCoverUrl(row.cover?.url),
    };
  }

  async getScreenshots(
    igdbId: number,
    limit = IGDB_IMPORT_SCREENSHOT_LIMIT,
  ): Promise<IgdbScreenshot[]> {
    const rows = await this.post<IgdbScreenshotRow[]>(
      '/screenshots',
      `fields id,url; where game = ${igdbId}; limit ${limit};`,
    );

    return rows
      .map((row, index) => ({
        igdbId: row.id ?? null,
        url: toImageUrl(row.url),
        sortOrder: index,
      }))
      .filter((row) => Boolean(row.url))
      .map(({ igdbId: screenshotId, url }) => ({ igdbId: screenshotId, url }));
  }

  async getVideos(igdbId: number, limit = IGDB_IMPORT_VIDEO_LIMIT): Promise<IgdbVideo[]> {
    const rows = await this.post<IgdbVideoRow[]>(
      '/game_videos',
      `fields id,name,video_id; where game = ${igdbId}; limit ${limit};`,
    );

    return rows
      .map((row) => ({
        igdbId: row.id ?? null,
        title: row.name ?? null,
        url: row.video_id ? `https://www.youtube.com/embed/${row.video_id}` : '',
      }))
      .filter((row) => Boolean(row.url));
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
      throw new Error(`IGDB ${path} failed (${response.status}): ${text}`);
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
      throw new Error(`IGDB OAuth failed (${response.status}): ${text}`);
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

function toImageUrl(url?: string): string {
  if (!url) {
    return '';
  }
  return url.startsWith('//') ? `https:${url}` : url;
}

function toCoverUrl(url?: string): string | null {
  const normalized = toImageUrl(url);
  return normalized || null;
}
