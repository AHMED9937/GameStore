import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { StoreSettingsRepository } from '@gamestore/api/data-access';
import { AdminStoreSettingsService } from './admin-store-settings.service';

describe('AdminStoreSettingsService', () => {
  const storeSettings = {
    get: vi.fn(),
    set: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  } satisfies Pick<StoreSettingsRepository, 'get' | 'set' | 'delete'>;

  const service = new AdminStoreSettingsService(
    storeSettings as unknown as StoreSettingsRepository,
  );

  it('getDefaultActivationVideo returns stored url', async () => {
    storeSettings.get.mockResolvedValue('https://www.youtube.com/embed/abc123');
    await expect(service.getDefaultActivationVideo()).resolves.toEqual({
      url: 'https://www.youtube.com/embed/abc123',
    });
  });

  it('updateDefaultActivationVideo normalizes watch URLs', async () => {
    const result = await service.updateDefaultActivationVideo(
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    );
    expect(result).toEqual({
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    });
    expect(storeSettings.set).toHaveBeenCalledWith(
      'default_activation_video_url',
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
    );
  });

  it('updateDefaultActivationVideo clears the setting when url is null', async () => {
    await expect(
      service.updateDefaultActivationVideo(null),
    ).resolves.toEqual({ url: null });
    expect(storeSettings.delete).toHaveBeenCalledWith(
      'default_activation_video_url',
    );
  });

  it('updateDefaultActivationVideo rejects invalid URLs', async () => {
    await expect(
      service.updateDefaultActivationVideo('https://example.com/not-youtube'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('getFaqUbisoftSettings returns all stored values', async () => {
    storeSettings.get.mockImplementation(async (key: string) => {
      const values: Record<string, string> = {
        faq_ubisoft_method1_video_url: 'https://www.youtube.com/embed/m1',
        faq_ubisoft_method2_video_url: 'https://www.youtube.com/embed/m2',
        faq_ubisoft_locker_download_url: 'https://example.com/download',
        faq_ubisoft_locker_github_url: 'https://github.com/example/repo',
      };
      return values[key] ?? null;
    });

    await expect(service.getFaqUbisoftSettings()).resolves.toEqual({
      method1VideoUrl: 'https://www.youtube.com/embed/m1',
      method2VideoUrl: 'https://www.youtube.com/embed/m2',
      lockerDownloadUrl: 'https://example.com/download',
      lockerGithubUrl: 'https://github.com/example/repo',
    });
  });

  it('updateFaqUbisoftSettings normalizes youtube URLs and saves links', async () => {
    storeSettings.get.mockImplementation(async (key: string) => {
      const values: Record<string, string> = {
        faq_ubisoft_method1_video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        faq_ubisoft_locker_download_url: 'https://example.com/tool.zip',
      };
      return values[key] ?? null;
    });

    const result = await service.updateFaqUbisoftSettings({
      method1VideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      lockerDownloadUrl: 'https://example.com/tool.zip',
    });

    expect(result.method1VideoUrl).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
    );
    expect(storeSettings.set).toHaveBeenCalledWith(
      'faq_ubisoft_method1_video_url',
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
    );
    expect(storeSettings.set).toHaveBeenCalledWith(
      'faq_ubisoft_locker_download_url',
      'https://example.com/tool.zip',
    );
  });

  it('updateFaqUbisoftSettings rejects invalid download URLs', async () => {
    await expect(
      service.updateFaqUbisoftSettings({
        lockerDownloadUrl: 'not-a-url',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
