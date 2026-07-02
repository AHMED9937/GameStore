import { Injectable } from '@nestjs/common';
import { IgdbClient } from './igdb-client';
import { IgdbConfig } from './igdb.config';

@Injectable()
export class IgdbService {
  private readonly client = new IgdbClient();

  health() {
    return IgdbConfig.isConfigured()
      ? { status: 'ok', integration: IgdbConfig.integration }
      : IgdbConfig.getSetupResponse('health');
  }

  searchGames(query: string) {
    return this.client.searchGames(query);
  }

  getGameDetails(igdbId: number) {
    return this.client.getGameDetails(igdbId);
  }

  getScreenshots(igdbId: number, limit?: number) {
    return this.client.getScreenshots(igdbId, limit);
  }

  getVideos(igdbId: number, limit?: number) {
    return this.client.getVideos(igdbId, limit);
  }

  async search(query: string) {
    if (!IgdbConfig.isConfigured()) {
      return IgdbConfig.getSetupResponse('search');
    }

    return this.searchGames(query);
  }
}
