import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServiceUnavailableException } from '@nestjs/common';
import type {
  GameAccountsRepository,
  LicensesRepository,
  OrdersRepository,
} from '@gamestore/api/data-access';
import type { PrismaService } from '@gamestore/api/prisma';
import type { PaddleService } from '@gamestore/api/paddle';
import { PaymentFulfillmentService } from './payment-fulfillment.service';

const pendingOrder = {
  id: 'order-1',
  gameId: 'game-1',
  status: 'pending',
  ownerId: 'user-1',
  license: null,
};

function buildPaidTransaction(overrides: Record<string, unknown> = {}) {
  return {
    id: 'txn_test_abc',
    status: 'completed',
    subscriptionId: null,
    customData: {
      gameId: 'game-1',
      userId: 'user-1',
      customerEmail: 'buyer@example.com',
    },
    details: {
      totals: {
        grandTotal: '1999',
      },
    },
    ...overrides,
  };
}

describe('PaymentFulfillmentService', () => {
  const orders = {
    findByProviderCheckoutId: vi.fn(),
    markCompleted: vi.fn(),
    markFailed: vi.fn(),
  } as unknown as OrdersRepository;

  const gameAccounts = {
    claimSeatForGame: vi.fn(),
    advanceNextAccountIfFull: vi.fn(),
  } as unknown as GameAccountsRepository;

  const licenses = {
    findActiveByOwnerAndGame: vi.fn(),
  } as unknown as LicensesRepository;

  const tx = {
    license: {
      create: vi.fn(),
    },
    order: {
      update: vi.fn(),
      create: vi.fn(),
    },
  };

  const prisma = {
    $transaction: vi.fn(async (fn: (client: typeof tx) => Promise<unknown>) =>
      fn(tx),
    ),
  } as unknown as PrismaService;

  const paddle = {
    retrieveTransaction: vi.fn(),
  } as unknown as PaddleService;

  let service: PaymentFulfillmentService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PaymentFulfillmentService(
      prisma,
      orders,
      gameAccounts,
      paddle,
      licenses,
    );
    vi.mocked(orders.findByProviderCheckoutId).mockResolvedValue(
      pendingOrder as never,
    );
    vi.mocked(licenses.findActiveByOwnerAndGame).mockResolvedValue(null);
    vi.mocked(gameAccounts.claimSeatForGame).mockResolvedValue({
      id: 'acct-1',
    } as never);
    vi.mocked(gameAccounts.advanceNextAccountIfFull).mockResolvedValue('acct-1');
    tx.license.create.mockResolvedValue({
      id: 'lic-1',
      licenseKey: 'GS-ABCD-EF01-2345',
    });
    tx.order.update.mockResolvedValue({
      id: 'order-1',
      status: 'completed',
    });
    tx.order.create.mockResolvedValue({
      id: 'free-order-1',
      status: 'completed',
    });
  });

  it('fulfills a paid checkout transaction with a reserved purchase license', async () => {
    const result = await service.handleTransactionCompleted(buildPaidTransaction());

    expect(result).toEqual({
      action: 'fulfilled',
      orderId: 'order-1',
      licenseId: 'lic-1',
    });
    expect(gameAccounts.claimSeatForGame).toHaveBeenCalledWith(
      'game-1',
      undefined,
      tx,
    );
    expect(tx.license.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        licenseKey: expect.stringMatching(/^GS-/),
        status: 'available',
        source: 'purchase',
        expiresAt: expect.any(Date),
        buyerEmail: 'buyer@example.com',
        validFrom: expect.any(Date),
        game: { connect: { id: 'game-1' } },
        account: { connect: { id: 'acct-1' } },
        owner: { connect: { id: 'user-1' } },
      }),
    });
    expect(gameAccounts.advanceNextAccountIfFull).toHaveBeenCalledWith(
      'game-1',
      tx,
    );
    expect(tx.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: expect.objectContaining({
        status: 'completed',
        licenseId: 'lic-1',
        providerPaymentId: 'txn_test_abc',
        buyerEmail: 'buyer@example.com',
        amount: 19.99,
        ownerId: 'user-1',
      }),
    });
  });

  it('returns no_pool_capacity when no seat can be claimed', async () => {
    vi.mocked(gameAccounts.claimSeatForGame).mockResolvedValue(null);

    const result = await service.handleTransactionCompleted(buildPaidTransaction());

    expect(result).toEqual({
      action: 'no_pool_capacity',
      orderId: 'order-1',
    });
    expect(tx.license.create).not.toHaveBeenCalled();
  });

  it('is idempotent when the order is already completed', async () => {
    vi.mocked(orders.findByProviderCheckoutId).mockResolvedValue({
      ...pendingOrder,
      status: 'completed',
      license: { id: 'lic-existing', licenseKey: 'GS-OLD', status: 'available' },
    } as never);

    const result = await service.handleTransactionCompleted(buildPaidTransaction());

    expect(result).toEqual({
      action: 'already_fulfilled',
      orderId: 'order-1',
      licenseId: 'lic-existing',
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(gameAccounts.claimSeatForGame).not.toHaveBeenCalled();
  });

  it('returns invalid_game when gameId cannot be resolved', async () => {
    vi.mocked(orders.findByProviderCheckoutId).mockResolvedValue({
      ...pendingOrder,
      gameId: null,
    } as never);

    const result = await service.handleTransactionCompleted({
      ...buildPaidTransaction(),
      customData: {},
    });

    expect(result).toEqual({
      action: 'invalid_game',
      orderId: 'order-1',
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('returns pending_payment when Paddle transaction is not completed', async () => {
    const result = await service.handleTransactionCompleted({
      ...buildPaidTransaction(),
      status: 'ready',
    });

    expect(result).toEqual({ action: 'pending_payment' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('ignores subscription transactions', async () => {
    const result = await service.handleTransactionCompleted({
      ...buildPaidTransaction(),
      subscriptionId: 'sub_123',
    });

    expect(result).toEqual({ action: 'ignored' });
  });

  it('syncFulfillmentFromPaddle delegates to handleTransactionCompleted when paid', async () => {
    vi.mocked(paddle.retrieveTransaction).mockResolvedValue(
      buildPaidTransaction() as never,
    );

    const result = await service.syncFulfillmentFromPaddle('txn_test_abc');

    expect(paddle.retrieveTransaction).toHaveBeenCalledWith('txn_test_abc');
    expect(result.action).toBe('fulfilled');
  });

  it('syncFulfillmentFromPaddle marks failed when Paddle transaction is canceled', async () => {
    vi.mocked(paddle.retrieveTransaction).mockResolvedValue({
      ...buildPaidTransaction(),
      status: 'canceled',
    } as never);

    const result = await service.syncFulfillmentFromPaddle('txn_test_abc');

    expect(result).toEqual({
      action: 'marked_failed',
      orderId: 'order-1',
    });
    expect(orders.markFailed).toHaveBeenCalledWith('txn_test_abc');
  });

  it('cancelPaddleTransaction marks unpaid transaction failed', async () => {
    vi.mocked(paddle.retrieveTransaction).mockResolvedValue({
      ...buildPaidTransaction(),
      status: 'past_due',
    } as never);

    const result = await service.cancelPaddleTransaction('txn_test_abc');

    expect(result).toEqual({
      action: 'marked_failed',
      orderId: 'order-1',
    });
    expect(orders.markFailed).toHaveBeenCalledWith('txn_test_abc');
  });

  it('cancelPaddleTransaction fulfills when payment already completed', async () => {
    vi.mocked(paddle.retrieveTransaction).mockResolvedValue(
      buildPaidTransaction() as never,
    );

    const result = await service.cancelPaddleTransaction('txn_test_abc');

    expect(result).toEqual({
      action: 'fulfilled',
      orderId: 'order-1',
      licenseId: 'lic-1',
    });
  });

  it('syncFulfillmentFromPaddle returns ignored when Paddle retrieve fails', async () => {
    vi.mocked(paddle.retrieveTransaction).mockRejectedValue(
      new Error('network down'),
    );

    const result = await service.syncFulfillmentFromPaddle('txn_test_abc');

    expect(result).toEqual({ action: 'ignored' });
  });

  it('rolls back when order update fails inside transaction', async () => {
    tx.order.update.mockRejectedValue(new Error('db down'));

    await expect(
      service.handleTransactionCompleted(buildPaidTransaction()),
    ).rejects.toThrow('db down');
  });

  it('marks pending orders failed on transaction past_due', async () => {
    const result = await service.handleTransactionFailed('txn_test_abc');

    expect(result).toEqual({
      action: 'marked_failed',
      orderId: 'order-1',
    });
    expect(orders.markFailed).toHaveBeenCalledWith('txn_test_abc');
  });

  it('maps ServiceUnavailableException from claim to no_pool_capacity', async () => {
    vi.mocked(gameAccounts.claimSeatForGame).mockImplementation(() => {
      throw new ServiceUnavailableException('No pool capacity');
    });

    const result = await service.handleTransactionCompleted(buildPaidTransaction());

    expect(result).toEqual({
      action: 'no_pool_capacity',
      orderId: 'order-1',
    });
  });

  describe('free game fulfillment', () => {
    it('grants a free game with a reserved license', async () => {
      const result = await service.fulfillFreeOrder({
        gameId: 'game-1',
        gameTitleSnapshot: 'Demo Game',
        gameSlugSnapshot: 'demo-game-1',
        ownerId: 'user-1',
        buyerEmail: 'buyer@example.com',
      });

      expect(result).toMatchObject({
        action: 'fulfilled',
        licenseId: 'lic-1',
        sessionId: expect.stringMatching(/^free_/),
      });
      expect(tx.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          gameId: 'game-1',
          gameTitleSnapshot: 'Demo Game',
          gameSlugSnapshot: 'demo-game-1',
          providerCheckoutId: expect.stringMatching(/^free_/),
          amount: 0,
          status: 'completed',
          licenseId: 'lic-1',
          ownerId: 'user-1',
          buyerEmail: 'buyer@example.com',
        }),
      });
    });

    it('returns already_fulfilled for a repeat claim', async () => {
      vi.mocked(licenses.findActiveByOwnerAndGame).mockResolvedValue({
        id: 'lic-existing',
        order: { id: 'order-existing', providerCheckoutId: 'free_existing' },
      } as never);

      const result = await service.fulfillFreeOrder({
        gameId: 'game-1',
        ownerId: 'user-1',
      });

      expect(result).toEqual({
        action: 'already_fulfilled',
        orderId: 'order-existing',
        licenseId: 'lic-existing',
        sessionId: 'free_existing',
      });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('returns no_pool_capacity when claim seat fails', async () => {
      vi.mocked(gameAccounts.claimSeatForGame).mockResolvedValue(null);

      const result = await service.fulfillFreeOrder({
        gameId: 'game-1',
        ownerId: 'user-1',
      });

      expect(result).toEqual({
        action: 'no_pool_capacity',
        sessionId: expect.stringMatching(/^free_/),
      });
    });
  });
});
