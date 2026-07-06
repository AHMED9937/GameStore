import { BadRequestException, Injectable } from '@nestjs/common';
import {
  DEFAULT_ACTIVATION_VIDEO_URL_KEY,
  StoreSettingsRepository,
} from '@gamestore/api/data-access';
import { toYoutubeEmbedFromIgdbVideoId } from '@gamestore/api/igdb';

export type ActivationVideoSettingDto = {
  url: string | null;
};

@Injectable()
export class AdminStoreSettingsService {
  constructor(private readonly storeSettings: StoreSettingsRepository) {}

  async getDefaultActivationVideo(): Promise<ActivationVideoSettingDto> {
    const url = await this.storeSettings.get(DEFAULT_ACTIVATION_VIDEO_URL_KEY);
    return { url };
  }

  async updateDefaultActivationVideo(
    rawUrl: string | null,
  ): Promise<ActivationVideoSettingDto> {
    if (rawUrl === null) {
      await this.storeSettings.delete(DEFAULT_ACTIVATION_VIDEO_URL_KEY);
      return { url: null };
    }

    const normalized = toYoutubeEmbedFromIgdbVideoId(rawUrl);
    if (!normalized) {
      throw new BadRequestException(
        'url must be a valid YouTube watch, youtu.be, or embed link',
      );
    }

    await this.storeSettings.set(DEFAULT_ACTIVATION_VIDEO_URL_KEY, normalized);
    return { url: normalized };
  }
}
