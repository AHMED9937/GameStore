import { Injectable } from '@nestjs/common';
import { PrismaService } from '@gamestore/api/prisma';
import type { Prisma } from '@prisma/client';

const gameSummarySelect = {
  id: true,
  title: true,
  slug: true,
  publishedAt: true,
} satisfies Prisma.GameSelect;

@Injectable()
export class SubscriptionPlansRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.subscriptionPlan.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        games: {
          include: {
            game: { select: gameSummarySelect },
          },
        },
      },
    });
  }

  findById(id: string) {
    return this.prisma.subscriptionPlan.findUnique({
      where: { id },
      include: {
        games: {
          include: {
            game: { select: gameSummarySelect },
          },
        },
      },
    });
  }

  findBySlug(slug: string) {
    return this.prisma.subscriptionPlan.findUnique({
      where: { slug },
      include: {
        games: {
          include: {
            game: { select: gameSummarySelect },
          },
        },
      },
    });
  }

  create(data: Prisma.SubscriptionPlanCreateInput) {
    return this.prisma.subscriptionPlan.create({ data });
  }

  update(id: string, data: Prisma.SubscriptionPlanUpdateInput) {
    return this.prisma.subscriptionPlan.update({
      where: { id },
      data,
    });
  }

  delete(id: string) {
    return this.prisma.subscriptionPlan.delete({ where: { id } });
  }

  setGames(planId: string, gameIds: string[]) {
    return this.prisma.$transaction([
      this.prisma.subscriptionPlanGame.deleteMany({ where: { planId } }),
      ...gameIds.map((gameId) =>
        this.prisma.subscriptionPlanGame.create({
          data: { planId, gameId },
        }),
      ),
    ]);
  }
}
