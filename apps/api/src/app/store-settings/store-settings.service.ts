import { Injectable } from '@nestjs/common';
import {
  FAQ_UBISOFT_LOCKER_DOWNLOAD_URL_KEY,
  FAQ_UBISOFT_LOCKER_GITHUB_URL_KEY,
  FAQ_UBISOFT_METHOD1_VIDEO_URL_KEY,
  FAQ_UBISOFT_METHOD2_VIDEO_URL_KEY,
  StoreSettingsRepository,
} from '@gamestore/api/data-access';

export type FaqUbisoftSettingsDto = {
  method1VideoUrl: string | null;
  method2VideoUrl: string | null;
  lockerDownloadUrl: string | null;
  lockerGithubUrl: string | null;
};

@Injectable()
export class StoreSettingsService {
  constructor(private readonly storeSettings: StoreSettingsRepository) {}

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
}
