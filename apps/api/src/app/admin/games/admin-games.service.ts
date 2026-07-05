import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GamesRepository } from '@gamestore/api/data-access';
import { PrismaService } from '@gamestore/api/prisma';
import { Prisma } from '@prisma/client';
import {
  hasGameSystemRequirementsContent,
  parseStoredGameSystemRequirements,
  serializeGameSystemRequirements,
  type GameSystemRequirements,
} from '@gamestore/shared/game-requirements';
import type { CreateGameDto } from '../../games/games.service';
import {
  normalizeBulkIds,
  runBulkIds,
  type BulkActionResult,
} from '../bulk-action.types';
import { EntitlementCleanupService } from '../../entitlements/entitlement-cleanup.service';
import type {
  AdminGameAccountSummary,
  AdminGameMediaDto,
  AdminGameReadinessDto,
  AdminReadinessCheck,
} from './admin-game.dto';

export type AdminGameDto = {
  id: string;
  title: string;
  slug: string;
  platform: string;
  priceBase: string;
  description: string | null;
  coverImage: string | null;
  coverCardImage: string | null;
  publishedAt: string | null;
  published: boolean;
  igdbId: number | null;
  igdbSyncedAt: string | null;
  igdbCoverUrl: string | null;
  releaseDate: string | null;
  genres: string[];
  requirementsMin: GameSystemRequirements | null;
  requirementsRecommended: GameSystemRequirements | null;
  media: AdminGameMediaDto[];
  accountSummary: AdminGameAccountSummary;
};

export type AdminCreateGameDto = CreateGameDto & {
  published?: boolean;
  genres?: string[];
  releaseDate?: string | null;
  requirementsMin?: GameSystemRequirements | null;
  requirementsRecommended?: GameSystemRequirements | null;
};

export type AdminUpdateGameDto = Partial<AdminCreateGameDto>;

type AdminGameRecord = NonNullable<
  Awaited<ReturnType<GamesRepository['findByIdAdmin']>>
>;

function slugifyTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toMediaDto(
  media: AdminGameRecord['media'][number],
): AdminGameMediaDto {
  return {
    id: media.id,
    type: media.type,
    url: media.url,
    title: media.title,
    sortOrder: media.sortOrder,
    igdbId: media.igdbId,
  };
}

@Injectable()
export class AdminGamesService {
  constructor(
    private readonly games: GamesRepository,
    private readonly prisma: PrismaService,
    private readonly entitlementCleanup: EntitlementCleanupService,
  ) {}

  async findAll(): Promise<AdminGameDto[]> {
    const rows = await this.games.findAllAdmin();
    const summaries = await this.getAccountSummariesBatch(rows.map((row) => row.id));
    return rows.map((row) =>
      this.toAdminGameDtoSync(
        row,
        summaries.get(row.id) ?? { total: 0, active: 0, hasActivePool: false },
      ),
    );
  }

  async findOne(id: string): Promise<AdminGameDto> {
    const game = await this.games.findByIdAdmin(id);
    if (!game) {
      throw new NotFoundException(`No game found with id "${id}"`);
    }
    return this.toAdminGameDto(game);
  }

  async create(dto: AdminCreateGameDto): Promise<AdminGameDto> {
    this.assertSteamPlatformOnCreate(dto.platform);

    try {
      const game = await this.games.create(this.buildCreateInput(dto));
      const adminGame = await this.games.findByIdAdmin(game.id);
      if (!adminGame) {
        throw new NotFoundException(`No game found with id "${game.id}"`);
      }
      return this.toAdminGameDto(adminGame);
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

  async update(id: string, dto: AdminUpdateGameDto): Promise<AdminGameDto> {
    const existing = await this.games.findByIdAdmin(id);
    if (!existing) {
      throw new NotFoundException(`No game found with id "${id}"`);
    }

    if (dto.platform !== undefined && dto.platform !== existing.platform) {
      throw new BadRequestException('Platform cannot be changed after create');
    }

    if (dto.published === true) {
      const readiness = await this.getReadiness(id);
      if (!readiness.canPublish) {
        throw new BadRequestException({
          message: 'Game is not ready to publish',
          code: 'GAME_NOT_READY',
          readiness,
        });
      }
    }

    if (dto.published === false && existing.publishedAt) {
      await this.entitlementCleanup.revokeAllLicensesForGame(id);
    }

    try {
      await this.games.update(id, this.buildUpdateInput(dto, existing));
      return this.findOne(id);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`No game found with id "${id}"`);
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Slug already exists');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<{ id: string; deleted: true }> {
    const existing = await this.games.findByIdAdmin(id);
    if (!existing) {
      throw new NotFoundException(`No game found with id "${id}"`);
    }

    await this.entitlementCleanup.prepareGameForDeletion(id);

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
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new ConflictException(
          'Cannot delete game while related records still exist',
        );
      }
      throw error;
    }
  }

  async bulkUnpublish(ids: string[]): Promise<BulkActionResult> {
    const normalized = normalizeBulkIds(ids);
    return runBulkIds(normalized, async (id) => {
      await this.update(id, { published: false });
    });
  }

  async bulkDelete(ids: string[]): Promise<BulkActionResult> {
    const normalized = normalizeBulkIds(ids);
    return runBulkIds(normalized, async (id) => {
      await this.remove(id);
    });
  }

  async getReadiness(id: string): Promise<AdminGameReadinessDto> {
    const game = await this.games.findByIdAdmin(id);
    if (!game) {
      throw new NotFoundException(`No game found with id "${id}"`);
    }

    const accountSummary = await this.getAccountSummary(id);
    const descriptionLength = game.description?.trim().length ?? 0;
    const videoCount = game.media.filter((m) => m.type === 'video').length;
    const activationCount = game.media.filter(
      (m) => m.type === 'activation',
    ).length;

    const checks: AdminReadinessCheck[] = [
      {
        id: 'title',
        label: 'Title set',
        passed: Boolean(game.title?.trim()),
        required: true,
      },
      {
        id: 'slug',
        label: 'Slug set',
        passed: Boolean(game.slug?.trim()),
        required: true,
      },
      {
        id: 'price',
        label: 'Base price set',
        passed: Number(game.priceBase) > 0,
        required: true,
      },
      {
        id: 'description',
        label: 'Description at least 50 characters',
        passed: descriptionLength >= 50,
        required: true,
      },
      {
        id: 'cover',
        label: 'Cover image URL',
        passed: Boolean(game.coverImage?.trim()),
        required: true,
      },
      {
        id: 'genres',
        label: 'At least one genre',
        passed: game.genres.length >= 1,
        required: true,
      },
      {
        id: 'pool',
        label: 'At least one active pool account',
        passed: accountSummary.hasActivePool,
        required: true,
      },
      {
        id: 'releaseDate',
        label: 'Release date',
        passed: game.releaseDate !== null,
        required: false,
      },
      {
        id: 'requirements',
        label: 'Min and recommended requirements',
        passed:
          hasGameSystemRequirementsContent(
            parseStoredGameSystemRequirements(game.requirementsMin),
          ) &&
          hasGameSystemRequirementsContent(
            parseStoredGameSystemRequirements(game.requirementsRecommended),
          ),
        required: false,
      },
      {
        id: 'video',
        label: 'At least one trailer video',
        passed: videoCount >= 1,
        required: false,
      },
      {
        id: 'activation',
        label: 'Activation walkthrough media',
        passed: activationCount >= 1,
        required: false,
      },
    ];

    const canPublish = checks.filter((c) => c.required).every((c) => c.passed);
    const ready =
      canPublish && checks.filter((c) => !c.required).every((c) => c.passed);

    return { ready, canPublish, checks };
  }

  static slugifyTitle(title: string): string {
    return slugifyTitle(title);
  }

  private async toAdminGameDto(game: AdminGameRecord): Promise<AdminGameDto> {
    const accountSummary = await this.getAccountSummary(game.id);
    return this.toAdminGameDtoSync(game, accountSummary);
  }

  private toAdminGameDtoSync(
    game: AdminGameRecord,
    accountSummary: AdminGameAccountSummary,
  ): AdminGameDto {
    return {
      id: game.id,
      title: game.title,
      slug: game.slug,
      platform: game.platform,
      priceBase: game.priceBase.toString(),
      description: game.description,
      coverImage: game.coverImage,
      coverCardImage: game.coverCardImage,
      publishedAt: game.publishedAt?.toISOString() ?? null,
      published: game.publishedAt !== null,
      igdbId: game.igdbId,
      igdbSyncedAt: game.igdbSyncedAt?.toISOString() ?? null,
      igdbCoverUrl: game.igdbCoverUrl,
      releaseDate: game.releaseDate?.toISOString().slice(0, 10) ?? null,
      genres: game.genres,
      requirementsMin: parseStoredGameSystemRequirements(game.requirementsMin),
      requirementsRecommended: parseStoredGameSystemRequirements(
        game.requirementsRecommended,
      ),
      media: game.media.map(toMediaDto),
      accountSummary,
    };
  }

  private async getAccountSummariesBatch(
    gameIds: string[],
  ): Promise<Map<string, AdminGameAccountSummary>> {
    if (gameIds.length === 0) {
      return new Map();
    }

    const accounts = await this.prisma.gameAccount.findMany({
      where: { gameId: { in: gameIds } },
      select: { gameId: true, isActive: true },
    });

    const counts = new Map<string, { total: number; active: number }>();
    for (const account of accounts) {
      const current = counts.get(account.gameId) ?? { total: 0, active: 0 };
      current.total += 1;
      if (account.isActive) {
        current.active += 1;
      }
      counts.set(account.gameId, current);
    }

    const summaries = new Map<string, AdminGameAccountSummary>();
    for (const gameId of gameIds) {
      const summary = counts.get(gameId) ?? { total: 0, active: 0 };
      summaries.set(gameId, {
        total: summary.total,
        active: summary.active,
        hasActivePool: summary.active > 0,
      });
    }

    return summaries;
  }

  private async getAccountSummary(
    gameId: string,
  ): Promise<AdminGameAccountSummary> {
    const [total, active] = await Promise.all([
      this.prisma.gameAccount.count({ where: { gameId } }),
      this.prisma.gameAccount.count({
        where: { gameId, isActive: true },
      }),
    ]);
    return { total, active, hasActivePool: active > 0 };
  }

  private assertSteamPlatformOnCreate(platform: string) {
    if (platform?.trim().toLowerCase() !== 'steam') {
      throw new BadRequestException(
        'New manual games must use platform "steam"',
      );
    }
  }

  private buildCreateInput(dto: AdminCreateGameDto): Prisma.GameCreateInput {
    const publishedAt =
      dto.published === true
        ? new Date()
        : dto.publishedAt
          ? new Date(dto.publishedAt)
          : null;

    return {
      title: dto.title,
      slug: dto.slug,
      platform: 'steam',
      priceBase: dto.priceBase,
      description: dto.description,
      coverImage: dto.coverImage,
      publishedAt,
      genres: dto.genres ?? [],
      releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : undefined,
      requirementsMin: serializeGameSystemRequirements(dto.requirementsMin),
      requirementsRecommended: serializeGameSystemRequirements(
        dto.requirementsRecommended,
      ),
    };
  }

  private buildUpdateInput(
    dto: AdminUpdateGameDto,
    existing: AdminGameRecord,
  ): Prisma.GameUpdateInput {
    const data: Prisma.GameUpdateInput = {};

    if (dto.title !== undefined) {
      data.title = dto.title;
    }
    if (dto.slug !== undefined) {
      data.slug = dto.slug;
    }
    if (dto.priceBase !== undefined) {
      data.priceBase = dto.priceBase;
    }
    if (dto.description !== undefined) {
      data.description = dto.description;
    }
    if (dto.coverImage !== undefined) {
      data.coverImage = dto.coverImage;
    }
    if (dto.genres !== undefined) {
      data.genres = dto.genres;
    }
    if (dto.releaseDate !== undefined) {
      data.releaseDate = dto.releaseDate ? new Date(dto.releaseDate) : null;
    }
    if (dto.requirementsMin !== undefined) {
      data.requirementsMin = serializeGameSystemRequirements(dto.requirementsMin);
    }
    if (dto.requirementsRecommended !== undefined) {
      data.requirementsRecommended = serializeGameSystemRequirements(
        dto.requirementsRecommended,
      );
    }

    if (dto.published === true) {
      data.publishedAt = dto.publishedAt
        ? new Date(dto.publishedAt)
        : new Date();
    } else if (dto.published === false) {
      data.publishedAt = null;
    } else if (dto.publishedAt !== undefined) {
      data.publishedAt = dto.publishedAt ? new Date(dto.publishedAt) : null;
    }

    if (dto.platform !== undefined && dto.platform !== existing.platform) {
      throw new BadRequestException('Platform cannot be changed after create');
    }

    return data;
  }
}
