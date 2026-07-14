import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  DEFAULT_ACTIVATION_VIDEO_URL_KEY,
  GameAccountsRepository,
  GamesRepository,
  StoreSettingsRepository,
  resolveAccountPoolStatus,
  resolveSoldOut,
} from '@gamestore/api/data-access';
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
import { DiscordNotifyService } from '../../discord/discord-notify.service';
import type {
  AdminGameAccountSummary,
  AdminGameMediaDto,
  AdminGameReadinessDto,
  AdminReadinessCheck,
} from './admin-game.dto';
import type {
  AdminGameListFiltersDto,
  AdminGameStatusFilter,
} from './admin-game-list-filters.dto';
import {
  normalizeEnumFilter,
  normalizeSearchTerm,
} from '@gamestore/api/data-access';

export type AdminGameDiscordDto = {
  configured: boolean;
  posted: boolean;
  messageId: string | null;
  announceDescription: string | null;
};

export type AdminGameDto = {
  id: string;
  title: string;
  slug: string;
  platform: string;
  priceBase: string;
  description: string | null;
  coverImage: string | null;
  coverCardImage: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  publishedAt: string | null;
  published: boolean;
  soldOut: boolean;
  soldOutManual: boolean;
  featuredOrder: number | null;
  nextAccountId: string | null;
  igdbId: number | null;
  igdbSyncedAt: string | null;
  igdbCoverUrl: string | null;
  releaseDate: string | null;
  genres: string[];
  requirementsMin: GameSystemRequirements | null;
  requirementsRecommended: GameSystemRequirements | null;
  media: AdminGameMediaDto[];
  accountSummary: AdminGameAccountSummary;
  discord: AdminGameDiscordDto;
};

export type AdminCreateGameDto = CreateGameDto & {
  published?: boolean;
  soldOut?: boolean;
  genres?: string[];
  releaseDate?: string | null;
  coverCardImage?: string | null;
  requirementsMin?: GameSystemRequirements | null;
  requirementsRecommended?: GameSystemRequirements | null;
  discordAnnounceDescription?: string | null;
};

export type AdminUpdateGameDto = Partial<AdminCreateGameDto>;

export type AdminFeaturedGameItemDto = {
  id: string;
  title: string;
  slug: string;
  platform: string;
  priceBase: string;
  coverImage: string | null;
  coverCardImage: string | null;
  featuredOrder: number | null;
  releaseDate: string | null;
};

export type AdminFeaturedGamesDto = {
  featured: AdminFeaturedGameItemDto[];
  available: AdminFeaturedGameItemDto[];
};

const MAX_FEATURED_GAMES = 5;

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

function normalizeOptionalAdminString(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  const trimmed = value?.trim() ?? '';
  return trimmed ? trimmed : null;
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
  private readonly logger = new Logger(AdminGamesService.name);

  constructor(
    private readonly games: GamesRepository,
    private readonly gameAccounts: GameAccountsRepository,
    private readonly prisma: PrismaService,
    private readonly entitlementCleanup: EntitlementCleanupService,
    private readonly storeSettings: StoreSettingsRepository,
    private readonly discordNotify: DiscordNotifyService,
  ) {}

  async findAll(filters?: AdminGameListFiltersDto): Promise<AdminGameDto[]> {
    const rows = await this.games.findAllAdmin(this.toGameFilters(filters));
    const summaries = await this.getAccountSummariesBatch(rows.map((row) => row.id));
    return rows.map((row) =>
      this.toAdminGameDtoSync(
        row,
        summaries.get(row.id) ?? { total: 0, active: 0, hasActivePool: false },
      ),
    );
  }

  private toGameFilters(filters?: AdminGameListFiltersDto): {
    q?: string;
    platform?: string;
    status?: AdminGameStatusFilter;
  } {
    const q = normalizeSearchTerm(filters?.q);
    const platform = normalizeSearchTerm(filters?.platform);
    const status = normalizeEnumFilter(filters?.status, [
      'published',
      'draft',
      'sold_out',
    ] as const);
    return {
      ...(q ? { q } : {}),
      ...(platform ? { platform } : {}),
      ...(status ? { status } : {}),
    };
  }

  async findOne(id: string): Promise<AdminGameDto> {
    const game = await this.games.findByIdAdmin(id);
    if (!game) {
      throw new NotFoundException(`No game found with id "${id}"`);
    }
    return this.toAdminGameDto(game);
  }

  async setNextAccount(
    gameId: string,
    accountId: string | null,
  ): Promise<AdminGameDto> {
    const game = await this.games.findByIdAdmin(gameId);
    if (!game) {
      throw new NotFoundException(`No game found with id "${gameId}"`);
    }

    if (accountId === null) {
      await this.gameAccounts.setNextAccountId(gameId, null);
      return this.findOne(gameId);
    }

    const account = await this.gameAccounts.findById(accountId);
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    if (account.gameId !== gameId) {
      throw new BadRequestException(
        'Account must be assigned to this game before it can be set as next',
      );
    }
    if (!account.isActive) {
      throw new BadRequestException('Only active accounts can be set as next');
    }

    const status = resolveAccountPoolStatus({
      isActive: account.isActive,
      activeUsersCount: account.activeUsersCount,
      maxActiveUsers: account.maxActiveUsers,
      lockedUntil: account.lockedUntil ?? null,
    });
    if (status.poolStatus === 'locked') {
      throw new BadRequestException(
        'Cannot set a Steam Guard–locked account as next for buyers',
      );
    }

    await this.gameAccounts.setNextAccountId(gameId, accountId);
    return this.findOne(gameId);
  }

  async create(dto: AdminCreateGameDto): Promise<AdminGameDto> {
    this.assertSteamPlatformOnCreate(dto.platform);

    try {
      const game = await this.games.create(this.buildCreateInput(dto));
      let adminGame = await this.findOne(game.id);
      if (dto.discordAnnounceDescription !== undefined) {
        await this.games.setDiscordAnnounceDescription(
          game.id,
          normalizeOptionalAdminString(dto.discordAnnounceDescription) ?? null,
        );
        adminGame = await this.findOne(game.id);
      }
      if (dto.published === true) {
        await this.syncDiscordForGame(adminGame, 'publish');
        adminGame = await this.findOne(game.id);
      }
      return adminGame;
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

    if (dto.soldOut === false) {
      const accountSummary = await this.getAccountSummary(id);
      const willBePublished =
        dto.published === true ||
        (dto.published !== false && existing.publishedAt !== null);
      if (willBePublished && !accountSummary.hasActivePool) {
        throw new BadRequestException(
          'Cannot mark game as available without an active pool account',
        );
      }
    }

    const becomingPublished =
      dto.published === true && existing.publishedAt === null;
    const becomingUnpublished =
      dto.published === false && existing.publishedAt !== null;
    const stayingPublished =
      existing.publishedAt !== null && dto.published !== false;
    const discordState = await this.games.getDiscordAnnouncementState(id);

    try {
      await this.games.update(id, this.buildUpdateInput(dto, existing));
      if (dto.discordAnnounceDescription !== undefined) {
        await this.games.setDiscordAnnounceDescription(
          id,
          normalizeOptionalAdminString(dto.discordAnnounceDescription) ?? null,
        );
      }
      let updated = await this.findOne(id);
      if (becomingPublished) {
        await this.syncDiscordForGame(updated, 'publish');
        updated = await this.findOne(id);
      } else if (becomingUnpublished && discordState.discordPublishMessageId) {
        // Delete channel message only after DB unpublish succeeds so a failed
        // save cannot orphan the game as published without a Discord post.
        await this.deleteDiscordAnnouncement(
          id,
          discordState.discordPublishMessageId,
        );
        updated = await this.findOne(id);
      } else if (stayingPublished && this.shouldSyncDiscordUpdate(dto)) {
        await this.syncDiscordForGame(
          this.applyDiscordDtoOverrides(updated, dto),
          'update',
        );
        updated = await this.findOne(id);
      }
      return updated;
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

    const discordState = await this.games.getDiscordAnnouncementState(id);
    if (discordState.discordPublishMessageId) {
      const removed = await this.discordNotify.deleteGameAnnouncement(
        discordState.discordPublishMessageId,
      );
      if (!removed) {
        this.logger.warn(
          `Discord announcement ${discordState.discordPublishMessageId} may remain after deleting game ${id}`,
        );
      }
    }

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

  async getFeaturedGames(q?: string): Promise<AdminFeaturedGamesDto> {
    const games = await this.games.findPublishedEligibleForFeatured();
    const featured = games
      .filter((game) => game.featuredOrder !== null)
      .sort((a, b) => (a.featuredOrder ?? 0) - (b.featuredOrder ?? 0))
      .map((game) => this.toFeaturedGameItemDto(game));
    const featuredIds = new Set(featured.map((game) => game.id));
    const search = normalizeSearchTerm(q)?.toLowerCase();
    const available = games
      .filter((game) => !featuredIds.has(game.id))
      .filter((game) => {
        if (!search) {
          return true;
        }
        return (
          game.title.toLowerCase().includes(search) ||
          game.slug.toLowerCase().includes(search)
        );
      })
      .map((game) => this.toFeaturedGameItemDto(game));

    return { featured, available };
  }

  async updateFeaturedGames(gameIds: string[]): Promise<AdminFeaturedGamesDto> {
    if (gameIds.length > MAX_FEATURED_GAMES) {
      throw new BadRequestException(
        `At most ${MAX_FEATURED_GAMES} games can be featured`,
      );
    }

    const uniqueIds = [...new Set(gameIds)];
    if (uniqueIds.length !== gameIds.length) {
      throw new BadRequestException('Duplicate game ids are not allowed');
    }

    if (uniqueIds.length === 0) {
      await this.games.setFeaturedOrder([]);
      return this.getFeaturedGames();
    }

    const games = await this.prisma.game.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, publishedAt: true },
    });

    if (games.length !== uniqueIds.length) {
      throw new BadRequestException('One or more games were not found');
    }

    const unpublished = games.filter((game) => game.publishedAt === null);
    if (unpublished.length > 0) {
      throw new BadRequestException('Only published games can be featured');
    }

    const items = uniqueIds.map((id, index) => ({
      id,
      featuredOrder: index + 1,
    }));
    await this.games.setFeaturedOrder(items);
    return this.getFeaturedGames();
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
    const defaultActivationUrl = await this.storeSettings.get(
      DEFAULT_ACTIVATION_VIDEO_URL_KEY,
    );

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
        passed: activationCount >= 1 || defaultActivationUrl !== null,
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

  private async toDiscordDtoForGame(gameId: string): Promise<AdminGameDiscordDto> {
    const state = await this.games.getDiscordAnnouncementState(gameId);
    return {
      configured: this.discordNotify.isWebhookConfigured(),
      posted: Boolean(state.discordPublishMessageId),
      messageId: state.discordPublishMessageId,
      announceDescription: state.discordAnnounceDescription,
    };
  }

  private async toAdminGameDto(game: AdminGameRecord): Promise<AdminGameDto> {
    const [accountSummary, discord] = await Promise.all([
      this.getAccountSummary(game.id),
      this.toDiscordDtoForGame(game.id),
    ]);
    return {
      ...this.toAdminGameDtoSync(game, accountSummary),
      discord,
    };
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
      metaTitle: game.metaTitle,
      metaDescription: game.metaDescription,
      ogImage: game.ogImage,
      publishedAt: game.publishedAt?.toISOString() ?? null,
      published: game.publishedAt !== null,
      soldOutManual: game.soldOut,
      soldOut: resolveSoldOut(game.soldOut, accountSummary.hasActivePool),
      featuredOrder: game.featuredOrder,
      nextAccountId: game.nextAccountId ?? null,
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
      discord: {
        configured: this.discordNotify.isWebhookConfigured(),
        posted: false,
        messageId: null,
        announceDescription: null,
      },
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
      if (!account.gameId) {
        continue;
      }
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

  private applyDiscordDtoOverrides(
    game: AdminGameDto,
    dto: AdminUpdateGameDto,
  ): AdminGameDto {
    const announceDescription =
      dto.discordAnnounceDescription !== undefined
        ? normalizeOptionalAdminString(dto.discordAnnounceDescription) ?? null
        : game.discord.announceDescription;

    return {
      ...game,
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
      ...(dto.priceBase !== undefined
        ? { priceBase: String(dto.priceBase) }
        : {}),
      ...(dto.coverImage !== undefined ? { coverImage: dto.coverImage } : {}),
      ...(dto.coverCardImage !== undefined
        ? { coverCardImage: dto.coverCardImage }
        : {}),
      ...(dto.soldOut !== undefined
        ? {
            soldOutManual: dto.soldOut,
            soldOut: resolveSoldOut(dto.soldOut, game.accountSummary.hasActivePool),
          }
        : {}),
      discord: {
        ...game.discord,
        announceDescription,
      },
    };
  }

  private shouldSyncDiscordUpdate(dto: AdminUpdateGameDto): boolean {
    return (
      dto.title !== undefined ||
      dto.slug !== undefined ||
      dto.priceBase !== undefined ||
      dto.coverImage !== undefined ||
      dto.coverCardImage !== undefined ||
      dto.soldOut !== undefined ||
      dto.discordAnnounceDescription !== undefined
    );
  }

  private buildDiscordPayload(game: AdminGameDto) {
    return {
      title: game.title,
      slug: game.slug,
      coverUrl: game.coverImage ?? game.coverCardImage ?? game.igdbCoverUrl,
      platform: game.platform,
      price: game.priceBase,
      soldOut: game.soldOut,
      announceDescription: game.discord.announceDescription,
    };
  }

  private async deleteDiscordAnnouncement(
    gameId: string,
    messageId: string,
  ): Promise<void> {
    try {
      const deleted = await this.discordNotify.deleteGameAnnouncement(messageId);
      if (!deleted) {
        this.logger.warn(
          `Discord delete did not confirm for game ${gameId} (message ${messageId}); keeping discordPublishMessageId for retry`,
        );
        return;
      }
      await this.games.setDiscordPublishMessageId(gameId, null);
    } catch (error) {
      this.logger.warn(
        `Discord delete error for game ${gameId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async syncDiscordForGame(
    game: AdminGameDto,
    intent: 'publish' | 'update',
  ): Promise<void> {
    try {
      const payload = this.buildDiscordPayload(game);
      if (intent === 'publish') {
        const messageId = await this.discordNotify.publishGameAnnouncement(payload);
        if (messageId) {
          await this.games.setDiscordPublishMessageId(game.id, messageId);
        } else {
          this.logger.warn(
            `Discord publish returned no message id for game ${game.id} (${game.slug})`,
          );
        }
        return;
      }

      const messageId = game.discord.messageId;
      if (messageId) {
        const updated = await this.discordNotify.updateGameAnnouncement(
          messageId,
          payload,
        );
        if (!updated) {
          this.logger.warn(
            `Discord update failed for game ${game.id} (message ${messageId})`,
          );
        }
        return;
      }

      if (game.published) {
        const newMessageId = await this.discordNotify.publishGameAnnouncement(payload);
        if (newMessageId) {
          await this.games.setDiscordPublishMessageId(game.id, newMessageId);
        } else {
          this.logger.warn(
            `Discord re-publish returned no message id for game ${game.id} (${game.slug})`,
          );
        }
      }
    } catch (error) {
      this.logger.warn(
        `Discord sync (${intent}) failed for game ${game.id}: ${error instanceof Error ? error.message : String(error)}`,
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
      ...(dto.metaTitle !== undefined
        ? { metaTitle: normalizeOptionalAdminString(dto.metaTitle) }
        : {}),
      ...(dto.metaDescription !== undefined
        ? { metaDescription: normalizeOptionalAdminString(dto.metaDescription) }
        : {}),
      ...(dto.ogImage !== undefined
        ? { ogImage: normalizeOptionalAdminString(dto.ogImage) }
        : {}),
      publishedAt,
      genres: dto.genres ?? [],
      releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : undefined,
      requirementsMin: serializeGameSystemRequirements(dto.requirementsMin),
      requirementsRecommended: serializeGameSystemRequirements(
        dto.requirementsRecommended,
      ),
      soldOut: dto.soldOut ?? false,
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
    if (dto.metaTitle !== undefined) {
      data.metaTitle = normalizeOptionalAdminString(dto.metaTitle);
    }
    if (dto.metaDescription !== undefined) {
      data.metaDescription = normalizeOptionalAdminString(dto.metaDescription);
    }
    if (dto.ogImage !== undefined) {
      data.ogImage = normalizeOptionalAdminString(dto.ogImage);
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
      data.featuredOrder = null;
    } else if (dto.publishedAt !== undefined) {
      data.publishedAt = dto.publishedAt ? new Date(dto.publishedAt) : null;
    }

    if (dto.soldOut !== undefined) {
      data.soldOut = dto.soldOut;
    }

    if (dto.platform !== undefined && dto.platform !== existing.platform) {
      throw new BadRequestException('Platform cannot be changed after create');
    }

    return data;
  }

  private toFeaturedGameItemDto(
    game: {
      id: string;
      title: string;
      slug: string;
      platform: string;
      priceBase: { toString(): string };
      coverImage: string | null;
      coverCardImage: string | null;
      featuredOrder: number | null;
      releaseDate: Date | null;
    },
  ): AdminFeaturedGameItemDto {
    return {
      id: game.id,
      title: game.title,
      slug: game.slug,
      platform: game.platform,
      priceBase: game.priceBase.toString(),
      coverImage: game.coverImage,
      coverCardImage: game.coverCardImage,
      featuredOrder: game.featuredOrder,
      releaseDate: game.releaseDate?.toISOString().slice(0, 10) ?? null,
    };
  }
}
