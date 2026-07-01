import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GamesRepository } from '@gamestore/api/data-access';
import { Prisma } from '@prisma/client';

export type GameDto = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  platform: string;
  priceBase: string;
  coverImage: string | null;
};

export type GameMediaDto = {
  id: string;
  type: string;
  url: string;
  title: string | null;
  sortOrder: number;
};

export type GameDetailDto = GameDto & {
  genres: string[];
  releaseDate: string | null;
  requirementsMin: string | null;
  requirementsRecommended: string | null;
  media: GameMediaDto[];
};

export type CreateGameDto = {
  title: string;
  slug: string;
  platform: string;
  priceBase: number | string;
  description?: string;
  coverImage?: string;
  publishedAt?: string | null;
  genres?: string[];
  releaseDate?: string | null;
  requirementsMin?: string | null;
  requirementsRecommended?: string | null;
};

type GameForDto = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  platform: string;
  priceBase: { toString(): string };
  coverImage: string | null;
};

type GameForDetailDto = GameForDto & {
  genres: string[];
  releaseDate: Date | null;
  requirementsMin: string | null;
  requirementsRecommended: string | null;
  media: Array<{
    id: string;
    type: string;
    url: string;
    title: string | null;
    sortOrder: number;
  }>;
};

function toDto(game: GameForDto): GameDto {
  return {
    id: game.id,
    slug: game.slug,
    title: game.title,
    description: game.description,
    platform: game.platform,
    priceBase: game.priceBase.toString(),
    coverImage: game.coverImage,
  };
}

function toDetailDto(game: GameForDetailDto): GameDetailDto {
  return {
    ...toDto(game),
    genres: game.genres,
    releaseDate: game.releaseDate?.toISOString().slice(0, 10) ?? null,
    requirementsMin: game.requirementsMin,
    requirementsRecommended: game.requirementsRecommended,
    media: game.media.map((item) => ({
      id: item.id,
      type: item.type,
      url: item.url,
      title: item.title,
      sortOrder: item.sortOrder,
    })),
  };
}

@Injectable()
export class GamesService {
  constructor(private readonly games: GamesRepository) {}

  async findAll(): Promise<GameDto[]> {
    const games = await this.games.findPublished();
    return games.map(toDto);
  }

  async findBySlug(slug: string): Promise<GameDetailDto> {
    const game = await this.games.findBySlug(slug);
    if (!game) {
      throw new NotFoundException(`No game found for slug "${slug}"`);
    }
    return toDetailDto(game);
  }

  async create(dto: CreateGameDto): Promise<GameDto> {
    try {
      const game = await this.games.create({
        title: dto.title,
        slug: dto.slug,
        platform: dto.platform,
        priceBase: dto.priceBase,
        description: dto.description,
        coverImage: dto.coverImage,
        publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : undefined,
      });
      return toDto(game);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(`Slug "${dto.slug}" already exists`);
      }
      throw error;
    }
  }

  async update(id: string, dto: Partial<CreateGameDto>): Promise<GameDto> {
    try {
      const game = await this.games.update(id, {
        ...dto,
        publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : undefined,
      });
      return toDto(game);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`No game found with id "${id}"`);
      }
      throw error;
    }
  }

  async remove(id: string): Promise<{ id: string; deleted: true }> {
    try {
      await this.games.delete(id);
      return { id, deleted: true };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`No game found with id "${id}"`);
      }
      throw error;
    }
  }
}
