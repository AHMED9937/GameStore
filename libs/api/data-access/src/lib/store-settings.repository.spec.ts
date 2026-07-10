import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '@gamestore/api/prisma';
import {
  DEFAULT_ACTIVATION_VIDEO_URL_KEY,
  StoreSettingsRepository,
} from './store-settings.repository';

describe('StoreSettingsRepository', () => {
  const prisma = {
    storeSetting: {
      findUnique: vi.fn(),
      upsert: vi.fn().mockResolvedValue(undefined),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  } as unknown as PrismaService;

  const repo = new StoreSettingsRepository(prisma);

  it('get returns null when setting is missing', async () => {
    vi.mocked(prisma.storeSetting.findUnique).mockResolvedValue(null);
    await expect(repo.get(DEFAULT_ACTIVATION_VIDEO_URL_KEY)).resolves.toBeNull();
  });

  it('get returns stored value', async () => {
    vi.mocked(prisma.storeSetting.findUnique).mockResolvedValue({
      value: 'https://www.youtube.com/embed/abc',
    });
    await expect(repo.get(DEFAULT_ACTIVATION_VIDEO_URL_KEY)).resolves.toBe(
      'https://www.youtube.com/embed/abc',
    );
  });

  it('set upserts the key', async () => {
    await repo.set(DEFAULT_ACTIVATION_VIDEO_URL_KEY, 'https://example.com');
    expect(prisma.storeSetting.upsert).toHaveBeenCalledWith({
      where: { key: DEFAULT_ACTIVATION_VIDEO_URL_KEY },
      create: {
        key: DEFAULT_ACTIVATION_VIDEO_URL_KEY,
        value: 'https://example.com',
      },
      update: { value: 'https://example.com' },
    });
  });

  it('delete removes the key', async () => {
    await repo.delete(DEFAULT_ACTIVATION_VIDEO_URL_KEY);
    expect(prisma.storeSetting.deleteMany).toHaveBeenCalledWith({
      where: { key: DEFAULT_ACTIVATION_VIDEO_URL_KEY },
    });
  });
});
