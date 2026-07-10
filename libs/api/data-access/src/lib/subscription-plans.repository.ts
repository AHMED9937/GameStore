import { Injectable } from '@nestjs/common';
import { PrismaService } from '@gamestore/api/prisma';
import type { Prisma } from '@prisma/client';
import {
  buildContainsFilter,
  normalizeEnumFilter,
  normalizeSearchTerm,
} from './admin-list-filters';

export type AdminSubscriptionPlanListFilters = {
  q?: string;
  status?: 'active' | 'inactive';
};

const gameSummarySelect = {
  id: true,
  title: true,
  slug: true,
  publishedAt: true,
} satisfies Prisma.GameSelect;

@Injectable()
export class SubscriptionPlansRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(filters?: AdminSubscriptionPlanListFilters) {
    const where: Prisma.SubscriptionPlanWhereInput = {};

    const q = normalizeSearchTerm(filters?.q);
    if (q) {
      where.OR = [
        { name: buildContainsFilter(q)! },
        { slug: buildContainsFilter(q)! },
      ];
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

    return this.prisma.subscriptionPlan.findMany({
      where,
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

  findActive() {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: [{ interval: 'asc' }, { intervalCount: 'asc' }],
      include: {
        games: {
          include: {
            game: {
              select: {
                ...gameSummarySelect,
                coverImage: true,
                coverCardImage: true,
              },
            },
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
