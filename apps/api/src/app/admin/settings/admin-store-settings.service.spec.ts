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
});
