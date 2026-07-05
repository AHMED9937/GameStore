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

  getScreenshots(igdbId: number) {
    return this.client.getScreenshots(igdbId);
  }

  getVideos(igdbId: number) {
    return this.client.getVideos(igdbId);
  }

  async search(query: string) {
    if (!IgdbConfig.isConfigured()) {
      return IgdbConfig.getSetupResponse('search');
    }

    return this.searchGames(query);
  }

  async preview(igdbId: number) {
    if (!IgdbConfig.isConfigured()) {
      return IgdbConfig.getSetupResponse('preview');
    }

    const details = await this.getGameDetails(igdbId);
    if (!details) {
      return null;
    }

    const { screenshots, videos } = await this.client.getGameMedia(igdbId);

    return { ...details, screenshots, videos };
  }
}
