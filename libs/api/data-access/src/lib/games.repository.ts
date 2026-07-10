import { Injectable } from '@nestjs/common';
import { PrismaService } from '@gamestore/api/prisma';
import type { Prisma } from '@prisma/client';
import {
  buildContainsFilter,
  buildExactFilter,
  normalizeEnumFilter,
  normalizeSearchTerm,
} from './admin-list-filters';

export type AdminGameListFilters = {
  q?: string;
  platform?: string;
  status?: 'published' | 'draft' | 'sold_out';
};

const gameMediaSelect = {
  id: true,
  type: true,
  url: true,
  title: true,
  igdbId: true,
  sortOrder: true,
} satisfies Prisma.GameMediaSelect;

export const catalogGameSelect = {
  id: true,
  slug: true,
  title: true,
  platform: true,
  priceBase: true,
  coverImage: true,
  coverCardImage: true,
  soldOut: true,
  genres: true,
} satisfies Prisma.GameSelect;

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
  soldOut: true,
  igdbId: true,
  releaseDate: true,
  genres: true,
  igdbSyncedAt: true,
  igdbCoverUrl: true,
  requirementsMin: true,
  requirementsRecommended: true,
  featuredOrder: true,
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
      select: catalogGameSelect,
    });
  }

  async findFeaturedPublished(limit = 5) {
    const curated = await this.prisma.game.findMany({
      where: {
        publishedAt: { not: null },
        featuredOrder: { not: null },
      },
      orderBy: { featuredOrder: 'asc' },
      take: limit,
      select: catalogGameSelect,
    });

    if (curated.length > 0) {
      return curated;
    }

    return this.prisma.game.findMany({
      where: { publishedAt: { not: null } },
      orderBy: [{ releaseDate: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      select: catalogGameSelect,
    });
  }

  findPublishedEligibleForFeatured() {
    return this.prisma.game.findMany({
      where: { publishedAt: { not: null } },
      orderBy: { title: 'asc' },
      select: {
        id: true,
        title: true,
        slug: true,
        platform: true,
        priceBase: true,
        coverImage: true,
        coverCardImage: true,
        featuredOrder: true,
        releaseDate: true,
      },
    });
  }

  async setFeaturedOrder(items: Array<{ id: string; featuredOrder: number }>) {
    await this.prisma.$transaction([
      this.prisma.game.updateMany({
        where: { featuredOrder: { not: null } },
        data: { featuredOrder: null },
      }),
      ...items.map((item) =>
        this.prisma.game.update({
          where: { id: item.id },
          data: { featuredOrder: item.featuredOrder },
        }),
      ),
    ]);
  }

  clearFeaturedOrder(gameIds: string[]) {
    if (gameIds.length === 0) {
      return Promise.resolve({ count: 0 });
    }
    return this.prisma.game.updateMany({
      where: { id: { in: gameIds } },
      data: { featuredOrder: null },
    });
  }

  findAllAdmin(filters?: AdminGameListFilters) {
    const where: Prisma.GameWhereInput = {};

    const q = normalizeSearchTerm(filters?.q);
    if (q) {
      where.OR = [
        { title: buildContainsFilter(q)! },
        { slug: buildContainsFilter(q)! },
      ];
    }

    const platform = buildExactFilter(filters?.platform);
    if (platform) {
      where.platform = platform;
    }

    const status = normalizeEnumFilter(filters?.status, [
      'published',
      'draft',
      'sold_out',
    ] as const);
    if (status === 'published') {
      where.publishedAt = { not: null };
      where.soldOut = false;
    } else if (status === 'draft') {
      where.publishedAt = null;
    } else if (status === 'sold_out') {
      where.soldOut = true;
    }

    return this.prisma.game.findMany({
      where,
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

  async getDiscordAnnouncementState(gameId: string) {
    const rows = await this.prisma.$queryRaw<
      Array<{
        discordPublishMessageId: string | null;
        discordAnnounceDescription: string | null;
      }>
    >`
      SELECT "discordPublishMessageId", "discordAnnounceDescription"
      FROM games
      WHERE id = ${gameId}
      LIMIT 1
    `;

    return (
      rows[0] ?? {
        discordPublishMessageId: null,
        discordAnnounceDescription: null,
      }
    );
  }

  setDiscordPublishMessageId(gameId: string, messageId: string | null) {
    return this.prisma.$executeRaw`
      UPDATE games
      SET "discordPublishMessageId" = ${messageId}
      WHERE id = ${gameId}
    `;
  }

  setDiscordAnnounceDescription(gameId: string, description: string | null) {
    return this.prisma.$executeRaw`
      UPDATE games
      SET "discordAnnounceDescription" = ${description}
      WHERE id = ${gameId}
    `;
  }
}
