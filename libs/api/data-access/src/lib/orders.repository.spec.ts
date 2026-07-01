import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '@gamestore/api/prisma';
import { OrdersRepository } from './orders.repository';

function createPrismaMock() {
  return {
    order: {
      create: vi.fn().mockResolvedValue({ id: 'order-1' }),
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({ id: 'order-1', status: 'completed' }),
    },
  };
}

describe('OrdersRepository', () => {
  it('createPending stores a pending order linked to the game', async () => {
    const prisma = createPrismaMock();
    const repo = new OrdersRepository(prisma as unknown as PrismaService);

    await repo.createPending({
      gameId: 'game-1',
      stripeSessionId: 'cs_test_abc',
      amount: 19.99,
      ownerId: 'user-1',
    });

    expect(prisma.order.create).toHaveBeenCalledWith({
      data: {
        game: { connect: { id: 'game-1' } },
        stripeSessionId: 'cs_test_abc',
        amount: 19.99,
        currency: 'USD',
        status: 'pending',
        owner: { connect: { id: 'user-1' } },
      },
      include: {
        game: { select: { id: true, title: true, slug: true } },
      },
    });
  });

  it('findByStripeSessionId includes game and license summaries', async () => {
    const prisma = createPrismaMock();
    const repo = new OrdersRepository(prisma as unknown as PrismaService);

    await repo.findByStripeSessionId('cs_test_abc');

    expect(prisma.order.findUnique).toHaveBeenCalledWith({
      where: { stripeSessionId: 'cs_test_abc' },
      include: {
        game: { select: { id: true, title: true, slug: true } },
        license: { select: { id: true, licenseKey: true, status: true } },
      },
    });
  });

  it('markCompleted sets status completed and links the license', async () => {
    const prisma = createPrismaMock();
    const repo = new OrdersRepository(prisma as unknown as PrismaService);

    await repo.markCompleted('order-1', {
      licenseId: 'lic-1',
      stripePaymentId: 'pi_test',
      buyerEmail: 'buyer@example.com',
      amount: 19.99,
    });

    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: {
        status: 'completed',
        licenseId: 'lic-1',
        stripePaymentId: 'pi_test',
        buyerEmail: 'buyer@example.com',
        amount: 19.99,
      },
      include: {
        game: { select: { id: true, title: true, slug: true } },
        license: { select: { id: true, licenseKey: true, status: true } },
      },
    });
  });

  it('markFailed sets status failed by stripe session id', async () => {
    const prisma = createPrismaMock();
    const repo = new OrdersRepository(prisma as unknown as PrismaService);

    await repo.markFailed('cs_test_abc');

    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { stripeSessionId: 'cs_test_abc' },
      data: { status: 'failed' },
    });
  });
});
