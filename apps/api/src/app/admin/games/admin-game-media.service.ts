import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@gamestore/api/prisma';
import type { AdminGameMediaDto } from './admin-game.dto';

const MEDIA_TYPES = new Set(['video', 'screenshot', 'activation']);

export type CreateGameMediaDto = {
  type: string;
  url: string;
  title?: string;
  sortOrder?: number;
  igdbId?: number;
};

export type UpdateGameMediaDto = Partial<CreateGameMediaDto>;

@Injectable()
export class AdminGameMediaService {
  constructor(private readonly prisma: PrismaService) {}

  async list(gameId: string): Promise<AdminGameMediaDto[]> {
    await this.assertGameExists(gameId);
    const rows = await this.prisma.gameMedia.findMany({
      where: { gameId },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map((row) => this.toDto(row));
  }

  async create(
    gameId: string,
    dto: CreateGameMediaDto,
  ): Promise<AdminGameMediaDto> {
    await this.assertGameExists(gameId);
    this.assertValidType(dto.type);

    const sortOrder =
      dto.sortOrder ??
      (await this.prisma.gameMedia.count({ where: { gameId } }));

    const row = await this.prisma.gameMedia.create({
      data: {
        gameId,
        type: dto.type,
        url: dto.url.trim(),
        title: dto.title?.trim() || null,
        sortOrder,
        igdbId: dto.igdbId ?? null,
      },
    });
    return this.toDto(row);
  }

  async update(
    gameId: string,
    mediaId: string,
    dto: UpdateGameMediaDto,
  ): Promise<AdminGameMediaDto> {
    await this.assertMediaBelongsToGame(gameId, mediaId);
    if (dto.type !== undefined) {
      this.assertValidType(dto.type);
    }

    const row = await this.prisma.gameMedia.update({
      where: { id: mediaId },
      data: {
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.url !== undefined ? { url: dto.url.trim() } : {}),
        ...(dto.title !== undefined
          ? { title: dto.title?.trim() || null }
          : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.igdbId !== undefined ? { igdbId: dto.igdbId } : {}),
      },
    });
    return this.toDto(row);
  }

  async remove(gameId: string, mediaId: string): Promise<{ id: string; deleted: true }> {
    await this.assertMediaBelongsToGame(gameId, mediaId);
    await this.prisma.gameMedia.delete({ where: { id: mediaId } });
    return { id: mediaId, deleted: true };
  }

  private toDto(row: {
    id: string;
    type: string;
    url: string;
    title: string | null;
    sortOrder: number;
    igdbId: number | null;
  }): AdminGameMediaDto {
    return {
      id: row.id,
      type: row.type,
      url: row.url,
      title: row.title,
      sortOrder: row.sortOrder,
      igdbId: row.igdbId,
    };
  }

  private assertValidType(type: string) {
    if (!MEDIA_TYPES.has(type)) {
      throw new BadRequestException(
        'Media type must be video, screenshot, or activation',
      );
    }
  }

  private async assertGameExists(gameId: string) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true },
    });
    if (!game) {
      throw new NotFoundException(`No game found with id "${gameId}"`);
    }
  }

  private async assertMediaBelongsToGame(gameId: string, mediaId: string) {
    const row = await this.prisma.gameMedia.findFirst({
      where: { id: mediaId, gameId },
    });
    if (!row) {
      throw new NotFoundException(`No media found with id "${mediaId}"`);
    }
  }
}
