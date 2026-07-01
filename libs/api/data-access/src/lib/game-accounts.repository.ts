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
  isActive: true,
  lockedUntil: true,
  lastHealthCheck: true,
  createdAt: true,
} satisfies Prisma.GameAccountSelect;

const MAX_ACTIVE_USERS = 50;

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

  findAvailableForGame(gameId: string) {
    const now = new Date();
    return this.prisma.gameAccount.findFirst({
      where: {
        gameId,
        isActive: true,
        activeUsersCount: { lt: MAX_ACTIVE_USERS },
        OR: [{ lockedUntil: null }, { lockedUntil: { lte: now } }],
      },
      orderBy: { activeUsersCount: 'asc' },
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

  incrementActiveUsers(id: string) {
    return this.prisma.gameAccount.update({
      where: { id },
      data: { activeUsersCount: { increment: 1 } },
      select: publicSelect,
    });
  }
}
