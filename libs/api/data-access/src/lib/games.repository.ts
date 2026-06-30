import { Injectable } from '@nestjs/common';
import { PrismaService } from '@gamestore/api/prisma';
import type { Prisma } from '@prisma/client';

@Injectable()
export class GamesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPublished() {
    return this.prisma.game.findMany({
      where: { publishedAt: { not: null } },
      orderBy: { title: 'asc' },
    });
  }

  findBySlug(slug: string) {
    return this.prisma.game.findUnique({ where: { slug } });
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
