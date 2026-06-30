import { Injectable } from '@nestjs/common';
import { IgdbConfig } from './igdb.config';

/** Setup shell — TODO(implement-igdb): Twitch IGDB API client */
@Injectable()
export class IgdbService {
  health() {
    return IgdbConfig.getSetupResponse('health');
  }

  search(_query: string) {
    return IgdbConfig.getSetupResponse('search');
  }

  importGame(_igdbId: number) {
    return IgdbConfig.getSetupResponse('import');
  }
}
