import { BadRequestException, Injectable } from '@nestjs/common';
import {
  DEFAULT_ACTIVATION_VIDEO_URL_KEY,
  FAQ_UBISOFT_LOCKER_DOWNLOAD_URL_KEY,
  FAQ_UBISOFT_LOCKER_GITHUB_URL_KEY,
  FAQ_UBISOFT_METHOD1_VIDEO_URL_KEY,
  FAQ_UBISOFT_METHOD2_VIDEO_URL_KEY,
  StoreSettingsRepository,
} from '@gamestore/api/data-access';
import { toYoutubeEmbedFromIgdbVideoId } from '@gamestore/api/igdb';
import type { UpdateFaqUbisoftSettingsBody } from './update-faq-ubisoft-settings.dto';

export type ActivationVideoSettingDto = {
  url: string | null;
};

export type FaqUbisoftSettingsDto = {
  method1VideoUrl: string | null;
  method2VideoUrl: string | null;
  lockerDownloadUrl: string | null;
  lockerGithubUrl: string | null;
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

  async getFaqUbisoftSettings(): Promise<FaqUbisoftSettingsDto> {
    const [
      method1VideoUrl,
      method2VideoUrl,
      lockerDownloadUrl,
      lockerGithubUrl,
    ] = await Promise.all([
      this.storeSettings.get(FAQ_UBISOFT_METHOD1_VIDEO_URL_KEY),
      this.storeSettings.get(FAQ_UBISOFT_METHOD2_VIDEO_URL_KEY),
      this.storeSettings.get(FAQ_UBISOFT_LOCKER_DOWNLOAD_URL_KEY),
      this.storeSettings.get(FAQ_UBISOFT_LOCKER_GITHUB_URL_KEY),
    ]);

    return {
      method1VideoUrl,
      method2VideoUrl,
      lockerDownloadUrl,
      lockerGithubUrl,
    };
  }

  async updateFaqUbisoftSettings(
    body: UpdateFaqUbisoftSettingsBody,
  ): Promise<FaqUbisoftSettingsDto> {
    const updates: Array<Promise<void>> = [];

    if (body.method1VideoUrl !== undefined) {
      updates.push(
        this.setYoutubeOrClear(
          FAQ_UBISOFT_METHOD1_VIDEO_URL_KEY,
          body.method1VideoUrl,
          'method1VideoUrl',
        ),
      );
    }

    if (body.method2VideoUrl !== undefined) {
      updates.push(
        this.setYoutubeOrClear(
          FAQ_UBISOFT_METHOD2_VIDEO_URL_KEY,
          body.method2VideoUrl,
          'method2VideoUrl',
        ),
      );
    }

    if (body.lockerDownloadUrl !== undefined) {
      updates.push(
        this.setHttpOrClear(
          FAQ_UBISOFT_LOCKER_DOWNLOAD_URL_KEY,
          body.lockerDownloadUrl,
          'lockerDownloadUrl',
        ),
      );
    }

    if (body.lockerGithubUrl !== undefined) {
      updates.push(
        this.setHttpOrClear(
          FAQ_UBISOFT_LOCKER_GITHUB_URL_KEY,
          body.lockerGithubUrl,
          'lockerGithubUrl',
        ),
      );
    }

    await Promise.all(updates);
    return this.getFaqUbisoftSettings();
  }

  private async setYoutubeOrClear(
    key: string,
    rawUrl: string | null,
    field: string,
  ): Promise<void> {
    if (rawUrl === null) {
      await this.storeSettings.delete(key);
      return;
    }

    const normalized = toYoutubeEmbedFromIgdbVideoId(rawUrl);
    if (!normalized) {
      throw new BadRequestException(
        `${field} must be a valid YouTube watch, youtu.be, or embed link`,
      );
    }

    await this.storeSettings.set(key, normalized);
  }

  private async setHttpOrClear(
    key: string,
    rawUrl: string | null,
    field: string,
  ): Promise<void> {
    if (rawUrl === null) {
      await this.storeSettings.delete(key);
      return;
    }

    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      throw new BadRequestException(`${field} must be a valid http(s) URL`);
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new BadRequestException(`${field} must be a valid http(s) URL`);
    }

    await this.storeSettings.set(key, parsed.toString());
  }
}
