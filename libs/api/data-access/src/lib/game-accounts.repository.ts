import { Injectable } from '@nestjs/common';
import { PrismaService } from '@gamestore/api/prisma';
import type { Prisma } from '@prisma/client';

/** Public projection — never expose passwordEncrypted or sharedSecret. */
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

  findAll(gameId?: string) {
    return this.prisma.gameAccount.findMany({
      where: gameId ? { gameId } : undefined,
      orderBy: { createdAt: 'desc' },
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

  incrementActiveUsers(id: string) {
    return this.prisma.gameAccount.update({
      where: { id },
      data: { activeUsersCount: { increment: 1 } },
      select: publicSelect,
    });
  }
}
