import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  GamesRepository,
  GameAccountsRepository,
  normalizeEnumFilter,
  normalizeSearchTerm,
  resolveAccountPoolStatus,
  type AccountPoolStatus,
} from '@gamestore/api/data-access';
import { GameAccountsService } from '../../game-accounts/game-accounts.service';
import { EntitlementCleanupService } from '../../entitlements/entitlement-cleanup.service';
import type { AdminAccountListFiltersDto } from './admin-account-list-filters.dto';

export type AdminAccountDto = {
  id: string;
  gameId: string | null;
  gameTitle: string | null;
  username: string;
  platform: string;
  region: string;
  activeUsersCount: number;
  maxActiveUsers: number;
  isActive: boolean;
  lockedUntil: string | null;
  guardLockedByLicenseId: string | null;
  lastHealthCheck: string | null;
  createdAt: string;
  openSeats: number;
  isClaimable: boolean;
  poolStatus: AccountPoolStatus;
};

export type CreateAdminAccountDto = {
  gameId?: string;
  username: string;
  password: string;
  sharedSecret: string;
  region?: string;
  maxActiveUsers?: number;
};

export type UpdateAdminAccountDto = {
  password?: string;
  sharedSecret?: string;
  region?: string;
  maxActiveUsers?: number;
};

export type AssignAdminAccountDto = {
  gameId: string;
};

export type UnassignAdminAccountDto = {
  targetAccountId?: string;
};

export type DeactivateAdminAccountDto = {
  targetAccountId?: string;
};

export type BulkAccountIdsDto = {
  ids: string[];
};

export type BulkAccountActionResult = {
  succeeded: string[];
  failed: Array<{ id: string; reason: string }>;
};

type AccountRowForDto = {
  id: string;
  gameId: string | null;
  username: string;
  platform: string;
  region: string;
  activeUsersCount: number;
  maxActiveUsers: number;
  isActive: boolean;
  lockedUntil?: Date | string | null;
  guardLockedByLicenseId?: string | null;
  lastHealthCheck?: Date | string | null;
  createdAt?: Date | string;
};

@Injectable()
export class AdminAccountsService {
  constructor(
    private readonly games: GamesRepository,
    private readonly gameAccounts: GameAccountsService,
    private readonly accounts: GameAccountsRepository,
    private readonly entitlementCleanup: EntitlementCleanupService,
  ) {}

  async findAll(filters?: AdminAccountListFiltersDto) {
    const normalized = this.toAccountFilters(filters);
    if (normalized.available) {
      const rows = await this.accounts.findAvailableForAssignment(normalized.q);
      return rows.map((row) => this.mapAdminAccountDto(row, null));
    }

    const rows = await this.accounts.findAll(normalized);
    const gameIds = [
      ...new Set(rows.map((row) => row.gameId).filter((id): id is string => id !== null)),
    ];
    const games = await Promise.all(gameIds.map((id) => this.games.findById(id)));
    const titleById = new Map<string, string>(
      games
        .filter((game): game is NonNullable<typeof game> => Boolean(game))
        .map((game) => [game.id, game.title]),
    );

    return rows.map((row) =>
      this.mapAdminAccountDto(
        row,
        row.gameId ? (titleById.get(row.gameId) ?? 'Unknown game') : null,
      ),
    );
  }

  private toAccountFilters(filters?: AdminAccountListFiltersDto): {
    q?: string;
    status?: 'active' | 'inactive';
    platform?: string;
    gameId?: string;
    available?: boolean;
  } {
    const q = normalizeSearchTerm(filters?.q);
    const platform = normalizeSearchTerm(filters?.platform);
    const gameId = normalizeSearchTerm(filters?.gameId);
    const status = normalizeEnumFilter(filters?.status, [
      'active',
      'inactive',
    ] as const);
    const available =
      filters?.available === 'true' || filters?.available === '1';
    return {
      ...(q ? { q } : {}),
      ...(platform ? { platform } : {}),
      ...(gameId ? { gameId } : {}),
      ...(status ? { status } : {}),
      ...(available ? { available } : {}),
    };
  }

  async findAvailable(query?: string) {
    const rows = await this.accounts.findAvailableForAssignment(query);
    return rows.map((row) => this.mapAdminAccountDto(row, null));
  }

  async findOne(id: string) {
    const account = await this.gameAccounts.findOne(id);
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const gameTitle = account.gameId
      ? ((await this.games.findById(account.gameId))?.title ?? 'Unknown game')
      : null;
    return this.mapAdminAccountDto(account, gameTitle);
  }

  async create(dto: CreateAdminAccountDto) {
    if (dto.gameId) {
      await this.assertSteamGame(dto.gameId);
    }

    const account = await this.gameAccounts.create({
      ...(dto.gameId ? { gameId: dto.gameId } : {}),
      platform: 'steam',
      username: dto.username,
      password: dto.password,
      sharedSecret: dto.sharedSecret,
      region: dto.region,
      maxActiveUsers: dto.maxActiveUsers,
    });

    if (dto.gameId) {
      const existingNext = await this.accounts.getNextAccountId(dto.gameId);
      if (!existingNext) {
        await this.accounts.setNextAccountId(dto.gameId, account.id);
      }
    }

    const gameTitle = dto.gameId
      ? ((await this.games.findById(dto.gameId))?.title ?? 'Unknown game')
      : null;
    return this.mapAdminAccountDto(account, gameTitle);
  }

  async assignToGame(accountId: string, dto: AssignAdminAccountDto) {
    const account = await this.gameAccounts.findOne(accountId);
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    if (!account.isActive) {
      throw new BadRequestException('Only active accounts can be assigned to a game');
    }
    if (account.gameId) {
      throw new BadRequestException('Account is already assigned to a game');
    }

    await this.assertSteamGame(dto.gameId);

    const updated = await this.accounts.assignToGame(accountId, dto.gameId);
    const existingNext = await this.accounts.getNextAccountId(dto.gameId);
    if (!existingNext) {
      await this.accounts.setNextAccountId(dto.gameId, accountId);
    }

    const gameTitle =
      (await this.games.findById(dto.gameId))?.title ?? 'Unknown game';
    return this.mapAdminAccountDto(updated, gameTitle);
  }

  async unassignFromGame(accountId: string, dto: UnassignAdminAccountDto = {}) {
    const account = await this.gameAccounts.findOne(accountId);
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    if (!account.gameId) {
      throw new BadRequestException('Account is not assigned to a game');
    }

    if (account.activeUsersCount > 0 && !dto.targetAccountId) {
      throw new BadRequestException(
        'targetAccountId is required when the account has occupied seats',
      );
    }

    try {
      const updated = await this.accounts.migrateLicensesOffAccount(
        accountId,
        account.gameId,
        dto.targetAccountId,
      );
      return this.mapAdminAccountDto(updated, null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to unassign account';
      throw new BadRequestException(message);
    }
  }

  async update(id: string, dto: UpdateAdminAccountDto) {
    const account = await this.gameAccounts.findOne(id);
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    if (account.gameId) {
      await this.assertSteamGame(account.gameId);
    }

    if (dto.maxActiveUsers !== undefined) {
      if (
        !Number.isInteger(dto.maxActiveUsers) ||
        dto.maxActiveUsers < 1
      ) {
        throw new BadRequestException('maxActiveUsers must be a positive integer');
      }
      if (dto.maxActiveUsers < account.activeUsersCount) {
        throw new BadRequestException(
          `maxActiveUsers cannot be below occupied seats (${account.activeUsersCount})`,
        );
      }
    }

    const updated = await this.gameAccounts.update(id, dto);
    const gameTitle = updated.gameId
      ? ((await this.games.findById(updated.gameId))?.title ?? 'Unknown game')
      : null;
    return this.mapAdminAccountDto(updated, gameTitle);
  }

  async clearGuardLock(id: string) {
    const account = await this.gameAccounts.findOne(id);
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    if (account.gameId) {
      await this.assertSteamGame(account.gameId);
    }

    const updated = await this.accounts.clearGuardLock(id);
    const gameTitle = updated.gameId
      ? ((await this.games.findById(updated.gameId))?.title ?? 'Unknown game')
      : null;
    return this.mapAdminAccountDto(updated, gameTitle);
  }

  async deactivate(id: string, dto: DeactivateAdminAccountDto = {}) {
    const account = await this.gameAccounts.findOne(id);
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    if (account.gameId) {
      await this.assertSteamGame(account.gameId);

      if (account.activeUsersCount > 0 && !dto.targetAccountId) {
        throw new BadRequestException(
          'targetAccountId is required when the account has occupied seats',
        );
      }

      try {
        await this.accounts.migrateLicensesOffAccount(
          id,
          account.gameId,
          dto.targetAccountId,
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to unassign account';
        throw new BadRequestException(message);
      }
    }

    const updated = await this.entitlementCleanup.deactivateAccountWithCleanup(id);
    const gameTitle = updated.gameId
      ? ((await this.games.findById(updated.gameId))?.title ?? 'Unknown game')
      : null;
    return this.mapAdminAccountDto(updated, gameTitle);
  }

  async reactivate(id: string) {
    const account = await this.gameAccounts.findOne(id);
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    if (account.gameId) {
      await this.assertSteamGame(account.gameId);
    }

    const updated = await this.gameAccounts.reactivate(id);
    const gameTitle = updated.gameId
      ? ((await this.games.findById(updated.gameId))?.title ?? 'Unknown game')
      : null;
    return this.mapAdminAccountDto(updated, gameTitle);
  }

  async remove(id: string) {
    const account = await this.gameAccounts.findOne(id);
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return this.gameAccounts.remove(id);
  }

  async bulkDeactivate(ids: string[]): Promise<BulkAccountActionResult> {
    const succeeded: string[] = [];
    const failed: Array<{ id: string; reason: string }> = [];

    for (const id of ids) {
      try {
        const account = await this.gameAccounts.findOne(id);
        if (!account) {
          failed.push({ id, reason: 'Account not found' });
          continue;
        }
        if (account.activeUsersCount > 0) {
          failed.push({
            id,
            reason:
              'Account has occupied seats. Open account edit to move seats, then deactivate.',
          });
          continue;
        }
        await this.deactivate(id);
        succeeded.push(id);
      } catch (error) {
        failed.push({
          id,
          reason: error instanceof Error ? error.message : 'Deactivate failed',
        });
      }
    }

    return { succeeded, failed };
  }

  async bulkDelete(ids: string[]): Promise<BulkAccountActionResult> {
    const succeeded: string[] = [];
    const failed: Array<{ id: string; reason: string }> = [];

    for (const id of ids) {
      try {
        await this.remove(id);
        succeeded.push(id);
      } catch (error) {
        failed.push({
          id,
          reason: error instanceof Error ? error.message : 'Delete failed',
        });
      }
    }

    return { succeeded, failed };
  }

  private async assertSteamGame(gameId: string) {
    const game = await this.games.findById(gameId);
    if (!game) {
      throw new NotFoundException('Game not found');
    }
    if (game.platform !== 'steam') {
      throw new BadRequestException('Pool accounts are only supported for Steam games');
    }
  }

  private mapAdminAccountDto(
    account: AccountRowForDto,
    gameTitle: string | null,
  ): AdminAccountDto {
    const status = resolveAccountPoolStatus({
      isActive: account.isActive,
      activeUsersCount: account.activeUsersCount,
      maxActiveUsers: account.maxActiveUsers,
      lockedUntil: account.lockedUntil ?? null,
    });

    const createdAt =
      account.createdAt instanceof Date
        ? account.createdAt.toISOString()
        : account.createdAt
          ? new Date(account.createdAt).toISOString()
          : new Date(0).toISOString();

    const lastHealthCheck = toIsoOrNull(account.lastHealthCheck);
    const guardLockedByLicenseId = account.guardLockedByLicenseId ?? null;

    return {
      id: account.id,
      gameId: account.gameId,
      gameTitle,
      username: account.username,
      platform: account.platform,
      region: account.region,
      activeUsersCount: account.activeUsersCount,
      maxActiveUsers: account.maxActiveUsers,
      isActive: account.isActive,
      lockedUntil: status.lockedUntil,
      guardLockedByLicenseId,
      lastHealthCheck,
      createdAt,
      openSeats: status.openSeats,
      isClaimable: status.isClaimable,
      poolStatus: status.poolStatus,
    };
  }
}

function toIsoOrNull(value: Date | string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}
