import { Injectable } from '@nestjs/common';
import { PrismaService } from '@gamestore/api/prisma';
import type { Prisma } from '@prisma/client';
import {
  buildContainsFilter,
  buildExactFilter,
  normalizeEnumFilter,
  normalizeSearchTerm,
} from './admin-list-filters';

export type AdminAccountListFilters = {
  q?: string;
  status?: 'active' | 'inactive';
  platform?: string;
  gameId?: string;
  available?: boolean;
};

/** Public projection never expose passwordEncrypted or sharedSecret. */
const publicSelect = {
  id: true,
  gameId: true,
  platform: true,
  username: true,
  region: true,
  activeUsersCount: true,
  maxActiveUsers: true,
  isActive: true,
  lockedUntil: true,
  guardLockedByLicenseId: true,
  lastHealthCheck: true,
  createdAt: true,
} satisfies Prisma.GameAccountSelect;

const MAX_ACTIVE_USERS_DEFAULT = 50;

@Injectable()
export class GameAccountsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(filters?: AdminAccountListFilters) {
    if (filters?.available) {
      return this.findAvailableForAssignment(filters.q);
    }

    const where: Prisma.GameAccountWhereInput = {};

    if (filters?.gameId) {
      where.gameId = filters.gameId;
    }

    const platform = buildExactFilter(filters?.platform);
    if (platform) {
      where.platform = platform;
    }

    const status = normalizeEnumFilter(filters?.status, [
      'active',
      'inactive',
    ] as const);
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    const q = normalizeSearchTerm(filters?.q);
    if (q) {
      where.OR = [
        { username: buildContainsFilter(q)! },
        { game: { title: buildContainsFilter(q)! } },
      ];
    }

    return this.prisma.gameAccount.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: publicSelect,
    });
  }

  findAvailableForAssignment(search?: string) {
    const query = search?.trim();
    const isSearch = Boolean(query);
    return this.prisma.gameAccount.findMany({
      where: {
        gameId: null,
        isActive: true,
        ...(isSearch
          ? { username: { contains: query, mode: 'insensitive' as const } }
          : {}),
      },
      // Default: newest inventory accounts for the game-edit picker.
      // Search: broader match set ordered by username.
      orderBy: isSearch ? { username: 'asc' } : { createdAt: 'desc' },
      take: isSearch ? 50 : 3,
      select: publicSelect,
    });
  }

  assignToGame(accountId: string, gameId: string) {
    return this.prisma.gameAccount.update({
      where: { id: accountId },
      data: { gameId },
      select: publicSelect,
    });
  }

  unassignFromGame(accountId: string) {
    return this.prisma.gameAccount.update({
      where: { id: accountId },
      data: { gameId: null },
      select: publicSelect,
    });
  }

  findById(id: string) {
    return this.prisma.gameAccount.findUnique({
      where: { id },
      select: publicSelect,
    });
  }

  findByIdWithSecrets(id: string) {
    return this.prisma.gameAccount.findUnique({
      where: { id },
    });
  }

  async findAvailableForGame(gameId: string) {
    const preferredId = await this.getNextAccountId(gameId);
    return this.findFirstClaimableAccount(gameId, preferredId ?? undefined);
  }

  /**
   * Atomically reserves one seat on a pool account for the game.
   * Prefer `preferredAccountId` (or Game.nextAccountId), then least-loaded failover.
   * `activeUsersCount` is occupied seats (reserved + activated).
   */
  async claimSeatForGame(
    gameId: string,
    preferredAccountId?: string | null,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    const preferred =
      preferredAccountId === undefined
        ? await this.getNextAccountId(gameId, client)
        : preferredAccountId;

    const orderedIds = await this.listClaimableAccountIds(
      gameId,
      preferred,
      client,
    );

    for (const accountId of orderedIds) {
      const claimed = await this.tryClaimSeat(accountId, client);
      if (claimed) {
        return claimed;
      }
    }

    return null;
  }

  async advanceNextAccountIfFull(
    gameId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    const game = await client.game.findUnique({
      where: { id: gameId },
      select: { nextAccountId: true },
    });
    if (!game) {
      return null;
    }

    const nextId = game.nextAccountId;
    if (nextId) {
      const current = await client.gameAccount.findUnique({
        where: { id: nextId },
        select: {
          id: true,
          gameId: true,
          isActive: true,
          activeUsersCount: true,
          maxActiveUsers: true,
          lockedUntil: true,
        },
      });
      if (
        current &&
        current.gameId === gameId &&
        this.isAccountClaimable(current)
      ) {
        return current.id;
      }
    }

    const replacement = await this.findFirstClaimableAccount(
      gameId,
      undefined,
      client,
      nextId ? [nextId] : [],
    );
    const replacementId = replacement?.id ?? null;

    await client.game.update({
      where: { id: gameId },
      data: { nextAccountId: replacementId },
    });

    return replacementId;
  }

  /**
   * Moves reserved + activated licenses from one pool account onto a chosen
   * destination on the same game, then clears gameId. Empty accounts unlink
   * without a target. When licenses exist, targetAccountId is required.
   */
  async migrateLicensesOffAccount(
    fromAccountId: string,
    gameId: string,
    targetAccountId?: string | null,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const source = await tx.gameAccount.findUnique({
        where: { id: fromAccountId },
        select: {
          id: true,
          gameId: true,
          activeUsersCount: true,
        },
      });
      if (!source || source.gameId !== gameId) {
        throw new Error('Account is not assigned to this game');
      }

      const licenses = await tx.license.findMany({
        where: {
          accountId: fromAccountId,
          status: { in: ['available', 'activated'] },
        },
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      });

      if (licenses.length > 0) {
        if (!targetAccountId) {
          throw new Error(
            'targetAccountId is required when licenses occupy this account',
          );
        }
        if (targetAccountId === fromAccountId) {
          throw new Error('Cannot migrate seats onto the same account');
        }

        const target = await tx.gameAccount.findUnique({
          where: { id: targetAccountId },
          select: {
            id: true,
            gameId: true,
            isActive: true,
            activeUsersCount: true,
            maxActiveUsers: true,
            lockedUntil: true,
          },
        });
        if (!target || target.gameId !== gameId) {
          throw new Error(
            'Target account must be assigned to the same game',
          );
        }
        if (!this.isAccountClaimable(target)) {
          throw new Error(
            'Target account is not claimable (inactive, locked, or full)',
          );
        }

        const max = target.maxActiveUsers ?? MAX_ACTIVE_USERS_DEFAULT;
        const openSeats = Math.max(0, max - target.activeUsersCount);
        if (openSeats < licenses.length) {
          throw new Error(
            `Cannot unassign: target has ${openSeats} open seats but ${licenses.length} seats must move`,
          );
        }

        for (const license of licenses) {
          const claimed = await this.tryClaimSeat(targetAccountId, tx);
          if (!claimed) {
            throw new Error(
              'Cannot unassign: target account ran out of capacity while migrating',
            );
          }

          await tx.license.update({
            where: { id: license.id },
            data: { accountId: targetAccountId },
          });

          await tx.gameAccount.updateMany({
            where: {
              id: fromAccountId,
              activeUsersCount: { gt: 0 },
            },
            data: { activeUsersCount: { decrement: 1 } },
          });

          await tx.gameAccount.updateMany({
            where: {
              id: fromAccountId,
              guardLockedByLicenseId: license.id,
            },
            data: { guardLockedByLicenseId: null },
          });
        }
      }

      const game = await tx.game.findUnique({
        where: { id: gameId },
        select: { nextAccountId: true },
      });
      if (game?.nextAccountId === fromAccountId) {
        const replacement = await this.findFirstClaimableAccount(
          gameId,
          undefined,
          tx,
          [fromAccountId],
        );
        await tx.game.update({
          where: { id: gameId },
          data: { nextAccountId: replacement?.id ?? null },
        });
      }

      return tx.gameAccount.update({
        where: { id: fromAccountId },
        data: { gameId: null },
        select: publicSelect,
      });
    });
  }

  async setNextAccountId(gameId: string, accountId: string | null) {
    return this.prisma.game.update({
      where: { id: gameId },
      data: { nextAccountId: accountId },
      select: { id: true, nextAccountId: true },
    });
  }

  getNextAccountId(
    gameId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<string | null> {
    const client = tx ?? this.prisma;
    return client.game
      .findUnique({
        where: { id: gameId },
        select: { nextAccountId: true },
      })
      .then((game) => game?.nextAccountId ?? null);
  }

  /** True when at least one assigned active account still has open seats. */
  async hasOpenPoolCapacity(gameId: string): Promise<boolean> {
    const account = await this.findFirstClaimableAccount(gameId);
    return account !== null;
  }

  private async tryClaimSeat(
    accountId: string,
    client: Prisma.TransactionClient | PrismaService,
  ) {
    const account = await client.gameAccount.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        maxActiveUsers: true,
        activeUsersCount: true,
        isActive: true,
        lockedUntil: true,
      },
    });
    if (!account || !this.isAccountClaimable(account)) {
      return null;
    }

    const max = account.maxActiveUsers ?? MAX_ACTIVE_USERS_DEFAULT;
    const result = await client.gameAccount.updateMany({
      where: {
        id: accountId,
        isActive: true,
        activeUsersCount: { lt: max },
        OR: [{ lockedUntil: null }, { lockedUntil: { lte: new Date() } }],
      },
      data: { activeUsersCount: { increment: 1 } },
    });

    if (result.count !== 1) {
      return null;
    }

    return client.gameAccount.findUnique({ where: { id: accountId } });
  }

  private async listClaimableAccountIds(
    gameId: string,
    preferredAccountId: string | null | undefined,
    client: Prisma.TransactionClient | PrismaService,
    excludeIds: string[] = [],
  ) {
    const now = new Date();
    const candidates = await client.gameAccount.findMany({
      where: {
        gameId,
        isActive: true,
        OR: [{ lockedUntil: null }, { lockedUntil: { lte: now } }],
        ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
      },
      orderBy: { activeUsersCount: 'asc' },
      select: {
        id: true,
        activeUsersCount: true,
        maxActiveUsers: true,
        lockedUntil: true,
        isActive: true,
      },
    });

    const open = candidates.filter((account) => this.isAccountClaimable(account));
    if (!preferredAccountId) {
      return open.map((account) => account.id);
    }

    const preferred = open.find((account) => account.id === preferredAccountId);
    const rest = open.filter((account) => account.id !== preferredAccountId);
    return preferred
      ? [preferred.id, ...rest.map((account) => account.id)]
      : rest.map((account) => account.id);
  }

  private async findFirstClaimableAccount(
    gameId: string,
    preferredAccountId?: string | null,
    client?: Prisma.TransactionClient | PrismaService,
    excludeIds: string[] = [],
  ) {
    const db = client ?? this.prisma;
    const orderedIds = await this.listClaimableAccountIds(
      gameId,
      preferredAccountId,
      db,
      excludeIds,
    );
    if (orderedIds.length === 0) {
      return null;
    }
    return db.gameAccount.findUnique({ where: { id: orderedIds[0] } });
  }

  private isAccountClaimable(account: {
    isActive: boolean;
    activeUsersCount: number;
    maxActiveUsers: number | null;
    lockedUntil: Date | null;
  }) {
    if (!account.isActive) {
      return false;
    }
    const now = new Date();
    if (account.lockedUntil && account.lockedUntil > now) {
      return false;
    }
    const max = account.maxActiveUsers ?? MAX_ACTIVE_USERS_DEFAULT;
    return account.activeUsersCount < max;
  }

  create(data: Prisma.GameAccountCreateInput) {
    return this.prisma.gameAccount.create({ data, select: publicSelect });
  }

  deactivate(id: string) {
    return this.prisma.gameAccount.update({
      where: { id },
      data: { isActive: false },
      select: publicSelect,
    });
  }

  update(id: string, data: Prisma.GameAccountUpdateInput) {
    return this.prisma.gameAccount.update({
      where: { id },
      data,
      select: publicSelect,
    });
  }

  reactivate(id: string) {
    return this.prisma.gameAccount.update({
      where: { id },
      data: { isActive: true },
      select: publicSelect,
    });
  }

  countActivatedLicenses(accountId: string) {
    return this.prisma.license.count({
      where: { accountId, status: 'activated' },
    });
  }

  delete(id: string) {
    return this.prisma.gameAccount.delete({
      where: { id },
      select: { id: true },
    });
  }

  async getActivePoolFlagsByGameIds(
    gameIds: string[],
  ): Promise<Map<string, boolean>> {
    if (gameIds.length === 0) {
      return new Map();
    }

    const accounts = await this.prisma.gameAccount.findMany({
      where: { gameId: { in: gameIds }, isActive: true },
      select: { gameId: true },
    });

    const flags = new Map<string, boolean>();
    for (const gameId of gameIds) {
      flags.set(gameId, false);
    }
    for (const account of accounts) {
      if (account.gameId) {
        flags.set(account.gameId, true);
      }
    }

    return flags;
  }

  incrementActiveUsers(id: string) {
    return this.prisma.gameAccount.update({
      where: { id },
      data: { activeUsersCount: { increment: 1 } },
      select: publicSelect,
    });
  }

  async decrementActiveUsers(id: string) {
    const account = await this.prisma.gameAccount.findUnique({
      where: { id },
      select: { id: true, activeUsersCount: true },
    });
    if (!account) {
      return null;
    }

    const nextCount = Math.max(0, account.activeUsersCount - 1);
    return this.prisma.gameAccount.update({
      where: { id },
      data: { activeUsersCount: nextCount },
      select: publicSelect,
    });
  }

  clearGuardLockIfMatches(accountId: string, licenseId: string) {
    return this.prisma.gameAccount.updateMany({
      where: { id: accountId, guardLockedByLicenseId: licenseId },
      data: { guardLockedByLicenseId: null },
    });
  }

  clearGuardLock(accountId: string) {
    return this.prisma.gameAccount.update({
      where: { id: accountId },
      data: {
        lockedUntil: null,
        guardLockedByLicenseId: null,
      },
      select: publicSelect,
    });
  }

  findActivatedLicensesByAccountId(accountId: string) {
    return this.prisma.license.findMany({
      where: { accountId, status: 'activated' },
      select: { id: true },
    });
  }

  /** Reserved + activated licenses that still hold a seat on this account. */
  countSeatHoldingLicenses(accountId: string) {
    return this.prisma.license.count({
      where: {
        accountId,
        status: { in: ['available', 'activated'] },
      },
    });
  }
}
