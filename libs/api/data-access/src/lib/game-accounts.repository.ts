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
    return this.prisma.gameAccount.findMany({
      where: {
        gameId: null,
        isActive: true,
        ...(query
          ? { username: { contains: query, mode: 'insensitive' as const } }
          : {}),
      },
      orderBy: { username: 'asc' },
      take: 50,
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
    const now = new Date();
    const candidates = await this.prisma.gameAccount.findMany({
      where: {
        gameId,
        isActive: true,
        OR: [{ lockedUntil: null }, { lockedUntil: { lte: now } }],
      },
      orderBy: { activeUsersCount: 'asc' },
      select: {
        id: true,
        activeUsersCount: true,
        maxActiveUsers: true,
      },
    });

    const available = candidates.find(
      (account) =>
        account.activeUsersCount <
        (account.maxActiveUsers ?? MAX_ACTIVE_USERS_DEFAULT),
    );

    if (!available) {
      return null;
    }

    return this.prisma.gameAccount.findUnique({
      where: { id: available.id },
    });
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

  findActivatedLicensesByAccountId(accountId: string) {
    return this.prisma.license.findMany({
      where: { accountId, status: 'activated' },
      select: { id: true },
    });
  }
}
