import { Injectable } from '@nestjs/common';
import { PrismaService } from '@gamestore/api/prisma';
import type { Prisma } from '@prisma/client';

const gameSummarySelect = {
  id: true,
  title: true,
  slug: true,
} satisfies Prisma.GameSelect;

@Injectable()
export class LicensesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByKey(licenseKey: string) {
    return this.prisma.license.findUnique({
      where: { licenseKey },
      include: { game: { select: gameSummarySelect } },
    });
  }

  findByOwnerId(ownerId: string) {
    return this.prisma.license.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        licenseKey: true,
        status: true,
        game: { select: gameSummarySelect },
      },
    });
  }

  findAll() {
    return this.prisma.license.findMany({
      orderBy: { createdAt: 'desc' },
      include: { game: { select: gameSummarySelect } },
    });
  }

  findById(id: string) {
    return this.prisma.license.findUnique({
      where: { id },
      include: { game: { select: gameSummarySelect } },
    });
  }

  create(data: Prisma.LicenseCreateInput) {
    return this.prisma.license.create({ data });
  }

  revoke(id: string) {
    return this.prisma.license.update({
      where: { id },
      data: { status: 'revoked' },
    });
  }
}
