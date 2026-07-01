import { Injectable } from '@nestjs/common';
import { PrismaService } from '@gamestore/api/prisma';
import type { Prisma } from '@prisma/client';

const gameSummarySelect = {
  id: true,
  title: true,
  slug: true,
  coverImage: true,
} satisfies Prisma.GameSelect;

@Injectable()
export class LicensesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByKey(licenseKey: string) {
    return this.prisma.license.findUnique({
      where: { licenseKey },
      include: {
        game: { select: gameSummarySelect },
        account: true,
      },
    });
  }

  findByKeyForActivation(licenseKey: string) {
    return this.findByKey(licenseKey);
  }

  activateLicense(params: {
    licenseId: string;
    accountId: string;
    ownerId: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      await tx.gameAccount.update({
        where: { id: params.accountId },
        data: { activeUsersCount: { increment: 1 } },
      });

      return tx.license.update({
        where: { id: params.licenseId },
        data: {
          accountId: params.accountId,
          ownerId: params.ownerId,
          status: 'activated',
          activatedAt: new Date(),
        },
        include: {
          game: { select: gameSummarySelect },
          account: true,
        },
      });
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
      include: {
        game: { select: gameSummarySelect },
        owner: { select: { email: true } },
      },
    });
  }

  findById(id: string) {
    return this.prisma.license.findUnique({
      where: { id },
      include: {
        game: { select: gameSummarySelect },
        owner: { select: { email: true } },
      },
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
