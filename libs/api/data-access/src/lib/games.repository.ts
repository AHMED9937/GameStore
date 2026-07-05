import { Injectable } from '@nestjs/common';
import { PrismaService } from '@gamestore/api/prisma';
import type { Prisma } from '@prisma/client';

const gameMediaSelect = {
  id: true,
  type: true,
  url: true,
  title: true,
  igdbId: true,
  sortOrder: true,
} satisfies Prisma.GameMediaSelect;

const adminGameSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  platform: true,
  priceBase: true,
  coverImage: true,
  coverCardImage: true,
  metaTitle: true,
  metaDescription: true,
  ogImage: true,
  publishedAt: true,
  igdbId: true,
  releaseDate: true,
  genres: true,
  igdbSyncedAt: true,
  igdbCoverUrl: true,
  requirementsMin: true,
  requirementsRecommended: true,
  createdAt: true,
  updatedAt: true,
  media: {
    orderBy: { sortOrder: 'asc' as const },
    select: gameMediaSelect,
  },
} satisfies Prisma.GameSelect;

@Injectable()
export class GamesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPublished() {
    return this.prisma.game.findMany({
      where: { publishedAt: { not: null } },
      orderBy: { title: 'asc' },
    });
  }

  findAllAdmin() {
    return this.prisma.game.findMany({
      orderBy: { title: 'asc' },
      select: adminGameSelect,
    });
  }

  findByIdAdmin(id: string) {
    return this.prisma.game.findUnique({
      where: { id },
      select: adminGameSelect,
    });
  }

  findBySlug(slug: string) {
    return this.prisma.game.findFirst({
      where: { slug, publishedAt: { not: null } },
      include: {
        media: {
          orderBy: { sortOrder: 'asc' },
          where: { type: { in: ['screenshot', 'video', 'activation'] } },
        },
      },
    });
  }

  findById(id: string) {
    return this.prisma.game.findUnique({ where: { id } });
  }

  create(data: Prisma.GameCreateInput) {
    return this.prisma.game.create({ data });
  }

  update(id: string, data: Prisma.GameUpdateInput) {
    return this.prisma.game.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.game.delete({ where: { id } });
  }
}
