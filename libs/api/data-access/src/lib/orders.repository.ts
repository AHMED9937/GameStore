import { Injectable } from '@nestjs/common';
import { PrismaService } from '@gamestore/api/prisma';
import type { Prisma } from '@prisma/client';
import {
  buildContainsFilter,
  buildExactFilter,
  normalizeSearchTerm,
} from './admin-list-filters';

export type AdminOrderListFilters = {
  q?: string;
  status?: string;
  orderType?: string;
};

const gameSummarySelect = {
  id: true,
  title: true,
  slug: true,
} satisfies Prisma.GameSelect;

const licenseSummarySelect = {
  id: true,
  licenseKey: true,
  status: true,
  source: true,
} satisfies Prisma.LicenseSelect;

export type CreatePendingOrderInput = {
  gameId: string;
  gameTitleSnapshot?: string;
  gameSlugSnapshot?: string;
  stripeSessionId: string;
  amount: Prisma.Decimal | string | number;
  currency?: string;
  ownerId?: string;
};

export type MarkOrderCompletedInput = {
  licenseId: string;
  stripePaymentId?: string;
  buyerEmail?: string;
  amount?: Prisma.Decimal | string | number;
  ownerId?: string;
};

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  createPending(data: CreatePendingOrderInput) {
    return this.prisma.order.create({
      data: {
        game: { connect: { id: data.gameId } },
        gameTitleSnapshot: data.gameTitleSnapshot,
        gameSlugSnapshot: data.gameSlugSnapshot,
        stripeSessionId: data.stripeSessionId,
        amount: data.amount,
        currency: data.currency ?? 'USD',
        status: 'pending',
        ...(data.ownerId ? { owner: { connect: { id: data.ownerId } } } : {}),
      },
      include: {
        game: { select: gameSummarySelect },
      },
    });
  }

  findByStripeSessionId(stripeSessionId: string) {
    return this.prisma.order.findUnique({
      where: { stripeSessionId },
      include: {
        game: { select: gameSummarySelect },
        license: { select: licenseSummarySelect },
      },
    });
  }

  findById(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        game: { select: gameSummarySelect },
        license: { select: licenseSummarySelect },
        owner: { select: { email: true } },
      },
    });
  }

  findAll(filters?: AdminOrderListFilters) {
    const where: Prisma.OrderWhereInput = {};

    const q = normalizeSearchTerm(filters?.q);
    if (q) {
      where.OR = [
        { gameTitleSnapshot: buildContainsFilter(q)! },
        { gameSlugSnapshot: buildContainsFilter(q)! },
        { buyerEmail: buildContainsFilter(q)! },
        { game: { title: buildContainsFilter(q)! } },
        { game: { slug: buildContainsFilter(q)! } },
      ];
    }

    const status = buildExactFilter(filters?.status);
    if (status) {
      where.status = status;
    }

    const orderType = buildExactFilter(filters?.orderType);
    if (orderType) {
      where.orderType = orderType;
    }

    return this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        game: { select: gameSummarySelect },
        license: { select: licenseSummarySelect },
        owner: { select: { email: true } },
      },
    });
  }

  markCompleted(id: string, data: MarkOrderCompletedInput) {
    return this.prisma.order.update({
      where: { id },
      data: {
        status: 'completed',
        licenseId: data.licenseId,
        stripePaymentId: data.stripePaymentId,
        buyerEmail: data.buyerEmail,
        ...(data.amount !== undefined ? { amount: data.amount } : {}),
        ...(data.ownerId !== undefined ? { ownerId: data.ownerId } : {}),
      },
      include: {
        game: { select: gameSummarySelect },
        license: { select: licenseSummarySelect },
      },
    });
  }

  markFailed(stripeSessionId: string) {
    return this.prisma.order.update({
      where: { stripeSessionId },
      data: { status: 'failed' },
    });
  }

  deleteById(id: string) {
    return this.prisma.order.delete({ where: { id } });
  }
}
