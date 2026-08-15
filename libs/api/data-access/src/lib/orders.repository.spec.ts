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
      delete: vi.fn().mockResolvedValue({ id: 'order-1' }),
    },
  };
}

describe('OrdersRepository', () => {
  it('createPending stores a pending order linked to the game', async () => {
    const prisma = createPrismaMock();
    const repo = new OrdersRepository(prisma as unknown as PrismaService);

    await repo.createPending({
      gameId: 'game-1',
      providerCheckoutId: 'txn_test_abc',
      amount: 19.99,
      ownerId: 'user-1',
    });

    expect(prisma.order.create).toHaveBeenCalledWith({
      data: {
        game: { connect: { id: 'game-1' } },
        providerCheckoutId: 'txn_test_abc',
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

  it('findByProviderCheckoutId includes game and license summaries', async () => {
    const prisma = createPrismaMock();
    const repo = new OrdersRepository(prisma as unknown as PrismaService);

    await repo.findByProviderCheckoutId('txn_test_abc');

    expect(prisma.order.findUnique).toHaveBeenCalledWith({
      where: { providerCheckoutId: 'txn_test_abc' },
      include: {
        game: { select: { id: true, title: true, slug: true } },
        license: { select: { id: true, licenseKey: true, status: true, source: true } },
      },
    });
  });

  it('markCompleted sets status completed and links the license', async () => {
    const prisma = createPrismaMock();
    const repo = new OrdersRepository(prisma as unknown as PrismaService);

    await repo.markCompleted('order-1', {
      licenseId: 'lic-1',
      providerPaymentId: 'txn_test_abc',
      buyerEmail: 'buyer@example.com',
      amount: 19.99,
    });

    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: {
        status: 'completed',
        licenseId: 'lic-1',
        providerPaymentId: 'txn_test_abc',
        buyerEmail: 'buyer@example.com',
        amount: 19.99,
      },
      include: {
        game: { select: { id: true, title: true, slug: true } },
        license: { select: { id: true, licenseKey: true, status: true, source: true } },
      },
    });
  });

  it('markFailed sets status failed by provider checkout id', async () => {
    const prisma = createPrismaMock();
    const repo = new OrdersRepository(prisma as unknown as PrismaService);

    await repo.markFailed('txn_test_abc');

    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { providerCheckoutId: 'txn_test_abc' },
      data: { status: 'failed' },
    });
  });

  it('deleteById removes an order row', async () => {
    const prisma = createPrismaMock();
    const repo = new OrdersRepository(prisma as unknown as PrismaService);

    await repo.deleteById('order-1');

    expect(prisma.order.delete).toHaveBeenCalledWith({ where: { id: 'order-1' } });
  });
});
