import { Injectable } from '@nestjs/common';
import { PrismaService } from '@gamestore/api/prisma';
import type { Prisma } from '@prisma/client';

@Injectable()
export class UserSubscriptionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByProviderSubscriptionId(providerSubscriptionId: string) {
    return this.prisma.userSubscription.findUnique({
      where: { providerSubscriptionId },
      include: {
        plan: {
          include: {
            games: {
              include: {
                game: true,
              },
            },
          },
        },
        licenses: true,
      },
    });
  }

  findByUserId(userId: string) {
    return this.prisma.userSubscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        plan: true,
        licenses: {
          include: {
            game: { select: { id: true, title: true, slug: true, coverImage: true } },
          },
        },
      },
    });
  }

  create(data: Prisma.UserSubscriptionCreateInput) {
    return this.prisma.userSubscription.create({ data });
  }

  update(id: string, data: Prisma.UserSubscriptionUpdateInput) {
    return this.prisma.userSubscription.update({
      where: { id },
      data,
    });
  }

  updateByProviderSubscriptionId(
    providerSubscriptionId: string,
    data: Prisma.UserSubscriptionUpdateInput,
  ) {
    return this.prisma.userSubscription.update({
      where: { providerSubscriptionId },
      data,
    });
  }
}
