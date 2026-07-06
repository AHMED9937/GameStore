import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DEFAULT_ACTIVATION_VIDEO_URL_KEY,
  GameAccountsRepository,
  GamesRepository,
  StoreSettingsRepository,
  resolveSoldOut,
} from '@gamestore/api/data-access';
import {
  type GameSystemRequirements,
  parseStoredGameSystemRequirements,
  serializeGameSystemRequirements,
} from '@gamestore/shared/game-requirements';
import { Prisma } from '@prisma/client';
import {
  STORE_DEFAULT_ACTIVATION_MEDIA_ID,
  STORE_DEFAULT_ACTIVATION_TITLE,
} from './activation-video.constants';

export type GameDto = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  platform: string;
  priceBase: string;
  coverImage: string | null;
  coverCardImage: string | null;
  soldOut: boolean;
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
  requirementsMin: GameSystemRequirements | null;
  requirementsRecommended: GameSystemRequirements | null;
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
  requirementsMin?: GameSystemRequirements | null;
  requirementsRecommended?: GameSystemRequirements | null;
};

type GameForDto = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  platform: string;
  priceBase: { toString(): string };
  coverImage: string | null;
  coverCardImage: string | null;
  soldOut?: boolean;
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
    description: game.description ?? null,
    platform: game.platform,
    priceBase: game.priceBase.toString(),
    coverImage: game.coverImage,
    coverCardImage: game.coverCardImage,
    soldOut: game.soldOut ?? false,
  };
}

function toDetailDto(game: GameForDetailDto): GameDetailDto {
  return {
    ...toDto(game),
    genres: game.genres,
    releaseDate: game.releaseDate?.toISOString().slice(0, 10) ?? null,
    requirementsMin: parseStoredGameSystemRequirements(game.requirementsMin),
    requirementsRecommended: parseStoredGameSystemRequirements(
      game.requirementsRecommended,
    ),
    media: game.media.map((item) => ({
      id: item.id,
      type: item.type,
      url: item.url,
      title: item.title,
      sortOrder: item.sortOrder,
    })),
  };
}

function withDefaultActivationMedia(
  media: GameForDetailDto['media'],
  defaultActivationUrl: string | null,
): GameForDetailDto['media'] {
  if (!defaultActivationUrl) {
    return media;
  }

  const hasActivation = media.some((item) => item.type === 'activation');
  if (hasActivation) {
    return media;
  }

  return [
    ...media,
    {
      id: STORE_DEFAULT_ACTIVATION_MEDIA_ID,
      type: 'activation',
      url: defaultActivationUrl,
      title: STORE_DEFAULT_ACTIVATION_TITLE,
      sortOrder: 0,
    },
  ];
}

function toGameWriteInput(
  dto: Partial<CreateGameDto>,
): Prisma.GameUpdateInput {
  const {
    requirementsMin,
    requirementsRecommended,
    publishedAt,
    releaseDate,
    ...rest
  } = dto;

  return {
    ...rest,
    ...(publishedAt !== undefined
      ? { publishedAt: publishedAt ? new Date(publishedAt) : null }
      : {}),
    ...(releaseDate !== undefined
      ? { releaseDate: releaseDate ? new Date(releaseDate) : null }
      : {}),
    ...(requirementsMin !== undefined
      ? { requirementsMin: serializeGameSystemRequirements(requirementsMin) }
      : {}),
    ...(requirementsRecommended !== undefined
      ? {
          requirementsRecommended: serializeGameSystemRequirements(
            requirementsRecommended,
          ),
        }
      : {}),
  };
}

@Injectable()
export class GamesService {
  constructor(
    private readonly games: GamesRepository,
    private readonly gameAccounts: GameAccountsRepository,
    private readonly storeSettings: StoreSettingsRepository,
  ) {}

  async findAll(): Promise<GameDto[]> {
    const rows = await this.games.findPublished();
    const poolFlags = await this.gameAccounts.getActivePoolFlagsByGameIds(
      rows.map((row) => row.id),
    );
    return rows.map((row) =>
      toDto({
        ...row,
        soldOut: resolveSoldOut(row.soldOut, poolFlags.get(row.id) ?? false),
      }),
    );
  }

  async findFeatured(limit = 5): Promise<GameDto[]> {
    const rows = await this.games.findFeaturedPublished(limit);
    const poolFlags = await this.gameAccounts.getActivePoolFlagsByGameIds(
      rows.map((row) => row.id),
    );
    return rows.map((row) =>
      toDto({
        ...row,
        soldOut: resolveSoldOut(row.soldOut, poolFlags.get(row.id) ?? false),
      }),
    );
  }

  async findBySlug(slug: string): Promise<GameDetailDto> {
    const game = await this.games.findBySlug(slug);
    if (!game) {
      throw new NotFoundException(`No game found for slug "${slug}"`);
    }

    const [poolFlags, defaultActivationUrl] = await Promise.all([
      this.gameAccounts.getActivePoolFlagsByGameIds([game.id]),
      this.storeSettings.get(DEFAULT_ACTIVATION_VIDEO_URL_KEY),
    ]);

    return toDetailDto({
      ...game,
      soldOut: resolveSoldOut(
        game.soldOut,
        poolFlags.get(game.id) ?? false,
      ),
      media: withDefaultActivationMedia(game.media, defaultActivationUrl),
    });
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
      const game = await this.games.update(id, toGameWriteInput(dto));
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
