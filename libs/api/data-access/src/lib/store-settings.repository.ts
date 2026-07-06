import { Injectable } from '@nestjs/common';
import { PrismaService } from '@gamestore/api/prisma';

export const DEFAULT_ACTIVATION_VIDEO_URL_KEY = 'default_activation_video_url';

@Injectable()
export class StoreSettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async get(key: string): Promise<string | null> {
    const row = await this.prisma.storeSetting.findUnique({
      where: { key },
      select: { value: true },
    });
    return row?.value ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    await this.prisma.storeSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }

  async delete(key: string): Promise<void> {
    await this.prisma.storeSetting.deleteMany({ where: { key } });
  }
}
