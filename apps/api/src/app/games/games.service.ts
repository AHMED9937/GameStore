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

export type CreateGameDto = {
  title: string;
  slug: string;
  platform: string;
  priceBase: number | string;
  description?: string;
  coverImage?: string;
  publishedAt?: string | null;
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

@Injectable()
export class GamesService {
  constructor(private readonly games: GamesRepository) {}

  async findAll(): Promise<GameDto[]> {
    const games = await this.games.findPublished();
    return games.map(toDto);
  }

  async findBySlug(slug: string): Promise<GameDto> {
    const game = await this.games.findBySlug(slug);
    if (!game) {
      throw new NotFoundException(`No game found for slug "${slug}"`);
    }
    return toDto(game);
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
