import { Injectable } from '@nestjs/common';
import { PrismaService } from '@gamestore/api/prisma';
import type { Prisma } from '@prisma/client';

export const gameDiscountSelect = {
  id: true,
  gameId: true,
  percentOff: true,
  startsAt: true,
  endsAt: true,
  showCountdown: true,
  enabled: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.GameDiscountSelect;

export type GameDiscountRecord = Prisma.GameDiscountGetPayload<{
  select: typeof gameDiscountSelect;
}>;

export type UpsertGameDiscountData = {
  percentOff: number;
  startsAt: Date;
  endsAt: Date;
  showCountdown: boolean;
  enabled: boolean;
};

@Injectable()
export class GameDiscountsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByGameId(gameId: string) {
    return this.prisma.gameDiscount.findUnique({
      where: { gameId },
      select: gameDiscountSelect,
    });
  }

  findByGameIds(gameIds: string[]) {
    if (gameIds.length === 0) {
      return Promise.resolve([] as GameDiscountRecord[]);
    }
    return this.prisma.gameDiscount.findMany({
      where: { gameId: { in: gameIds } },
      select: gameDiscountSelect,
    });
  }

  upsertForGame(gameId: string, data: UpsertGameDiscountData) {
    return this.prisma.gameDiscount.upsert({
      where: { gameId },
      create: {
        gameId,
        ...data,
      },
      update: data,
      select: gameDiscountSelect,
    });
  }

  disableForGame(gameId: string) {
    return this.prisma.gameDiscount.updateMany({
      where: { gameId },
      data: { enabled: false },
    });
  }
}
