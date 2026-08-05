import {
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '@gamestore/api/auth';
import type { GamesRepository, GameAccountsRepository, OrdersRepository, SubscriptionPlansRepository } from '@gamestore/api/data-access';
import { PaddleConfig, type PaddleService } from '@gamestore/api/paddle';
import type { PaymentFulfillmentService } from './payment-fulfillment.service';
import { PaymentsService } from './payments.service';

const user: AuthUser = {
  id: 'user-a',
  clerkId: 'clerk-a',
  email: 'buyer@example.com',
  firstName: 'Buyer',
  lastName: 'Test',
  role: 'user',
};

const publishedGame = {
  id: 'game-1',
  slug: 'demo-game-1',
  title: 'Demo Game',
  priceBase: { toString: () => '19.99' },
  paddleProductId: 'prod_game_1',
  coverImage: 'https://cdn.example.com/cover.jpg',
  publishedAt: new Date('2025-01-01'),
  soldOut: false,
};

describe('PaymentsService', () => {
  const games = {
    findById: vi.fn(),
    findBySlug: vi.fn(),
  } as unknown as GamesRepository;

  const gameAccounts = {
    getActivePoolFlagsByGameIds: vi.fn().mockResolvedValue(new Map([['game-1', true]])),
    hasOpenPoolCapacity: vi.fn().mockResolvedValue(true),
  } as unknown as GameAccountsRepository;

  const orders = {
    createPending: vi.fn(),
  } as unknown as OrdersRepository;

  const plans = {
    findBySlug: vi.fn(),
  } as unknown as SubscriptionPlansRepository;

  const paddle = {
    createCheckoutTransaction: vi.fn(),
    createSubscriptionCheckoutTransaction: vi.fn(),
  } as unknown as PaddleService;

  const fulfillment = {
    fulfillFreeOrder: vi.fn(),
  } as unknown as PaymentFulfillmentService;

  let service: PaymentsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PaymentsService(
      games,
      gameAccounts,
      orders,
      plans,
      paddle,
      fulfillment,
    );

    vi.spyOn(PaddleConfig, 'isCheckoutConfigured').mockReturnValue(true);
    vi.mocked(games.findBySlug).mockResolvedValue(publishedGame as never);
    vi.mocked(gameAccounts.getActivePoolFlagsByGameIds).mockResolvedValue(
      new Map([['game-1', true]]),
    );
    vi.mocked(gameAccounts.hasOpenPoolCapacity).mockResolvedValue(true);
    vi.mocked(paddle.createCheckoutTransaction).mockResolvedValue({
      transactionId: 'txn_test_abc',
      url: 'https://checkout.paddle.com/txn_test_abc',
    });
    vi.mocked(orders.createPending).mockResolvedValue({ id: 'order-1' } as never);
    vi.mocked(fulfillment.fulfillFreeOrder).mockResolvedValue({
      action: 'fulfilled',
      orderId: 'free-order-1',
      licenseId: 'lic-1',
      sessionId: 'free_abc123',
    });
  });

  it('creates a checkout transaction and pending order for a published game slug', async () => {
    const result = await service.createCheckout({ slug: 'demo-game-1' }, user);

    expect(paddle.createCheckoutTransaction).toHaveBeenCalledWith({
      gameId: 'game-1',
      gameSlug: 'demo-game-1',
      title: 'Demo Game',
      productId: 'prod_game_1',
      priceBase: 19.99,
      userId: 'user-a',
      customerEmail: 'buyer@example.com',
    });
    expect(orders.createPending).toHaveBeenCalledWith({
      gameId: 'game-1',
      gameTitleSnapshot: 'Demo Game',
      gameSlugSnapshot: 'demo-game-1',
      providerCheckoutId: 'txn_test_abc',
      amount: 19.99,
      ownerId: 'user-a',
    });
    expect(result).toEqual({
      sessionId: 'txn_test_abc',
      url: 'https://checkout.paddle.com/txn_test_abc',
    });
  });

  it('rejects checkout when gameId is missing and slug is absent', async () => {
    await expect(service.createCheckout({})).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects unpublished games by gameId', async () => {
    vi.mocked(games.findById).mockResolvedValue({
      ...publishedGame,
      publishedAt: null,
    } as never);

    await expect(service.createCheckout({ gameId: 'game-1' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects sold-out games', async () => {
    vi.mocked(games.findBySlug).mockResolvedValue({
      ...publishedGame,
      soldOut: true,
    } as never);
    vi.mocked(gameAccounts.getActivePoolFlagsByGameIds).mockResolvedValue(
      new Map([['game-1', true]]),
    );

    await expect(
      service.createCheckout({ slug: 'demo-game-1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects games with no active pool even when manual soldOut is false', async () => {
    vi.mocked(gameAccounts.getActivePoolFlagsByGameIds).mockResolvedValue(
      new Map([['game-1', false]]),
    );

    await expect(
      service.createCheckout({ slug: 'demo-game-1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns 404 when slug does not match a published game', async () => {
    vi.mocked(games.findBySlug).mockResolvedValue(null);

    await expect(
      service.createCheckout({ slug: 'missing-game' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns 503 when Paddle checkout env is misconfigured', async () => {
    vi.spyOn(PaddleConfig, 'isCheckoutConfigured').mockReturnValue(false);

    await expect(
      service.createCheckout({ slug: 'demo-game-1' }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('logs and rethrows when pending order creation fails after Paddle transaction', async () => {
    vi.mocked(orders.createPending).mockRejectedValue(new Error('db down'));
    const errorSpy = vi.spyOn(service['logger'], 'error');

    await expect(
      service.createCheckout({ slug: 'demo-game-1' }, user),
    ).rejects.toThrow('db down');

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('txn_test_abc'),
      expect.any(String),
    );
  });

  it('creates a checkout transaction at the discounted sale price when active', async () => {
    vi.mocked(games.findBySlug).mockResolvedValue({
      ...publishedGame,
      discount: {
        enabled: true,
        percentOff: 20,
        startsAt: new Date(Date.now() - 60_000),
        endsAt: new Date(Date.now() + 86_400_000),
        showCountdown: true,
      },
    } as never);

    await service.createCheckout({ slug: 'demo-game-1' }, user);

    expect(paddle.createCheckoutTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        priceBase: 15.99,
      }),
    );
    expect(orders.createPending).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 15.99,
        providerCheckoutId: 'txn_test_abc',
      }),
    );
  });

  it('creates a subscription checkout transaction for an active plan', async () => {
    vi.mocked(plans.findBySlug).mockResolvedValue({
      id: 'plan-1',
      slug: 'all-access-monthly',
      name: 'All Access',
      providerPriceId: 'pri_test_monthly',
      isActive: true,
      games: [{ gameId: 'game-1' }],
    } as never);
    vi.mocked(paddle.createSubscriptionCheckoutTransaction).mockResolvedValue({
      transactionId: 'txn_sub_test',
      url: 'https://checkout.paddle.com/txn_sub_test',
    });

    const result = await service.createSubscriptionCheckout(
      { planSlug: 'all-access-monthly' },
      user,
    );

    expect(paddle.createSubscriptionCheckoutTransaction).toHaveBeenCalledWith({
      planId: 'plan-1',
      planSlug: 'all-access-monthly',
      planName: 'All Access',
      providerPriceId: 'pri_test_monthly',
      userId: 'user-a',
      customerEmail: 'buyer@example.com',
    });
    expect(result.sessionId).toBe('txn_sub_test');
  });

  describe('free games (100% discount)', () => {
    const freeDiscount = {
      enabled: true,
      percentOff: 100,
      startsAt: new Date(Date.now() - 60_000),
      endsAt: new Date(Date.now() + 86_400_000),
      showCountdown: true,
    };

    it('skips Paddle and grants a license for a signed-in user', async () => {
      vi.mocked(games.findBySlug).mockResolvedValue({
        ...publishedGame,
        discount: freeDiscount,
      } as never);

      const result = await service.createCheckout({ slug: 'demo-game-1' }, user);

      expect(paddle.createCheckoutTransaction).not.toHaveBeenCalled();
      expect(fulfillment.fulfillFreeOrder).toHaveBeenCalledWith({
        gameId: 'game-1',
        gameTitleSnapshot: 'Demo Game',
        gameSlugSnapshot: 'demo-game-1',
        ownerId: 'user-a',
        buyerEmail: 'buyer@example.com',
      });
      expect(result).toEqual({
        sessionId: 'free_abc123',
        url: expect.stringContaining('success'),
      });
    });

    it('rejects anonymous claims of a free game', async () => {
      vi.mocked(games.findBySlug).mockResolvedValue({
        ...publishedGame,
        discount: freeDiscount,
      } as never);

      await expect(
        service.createCheckout({ slug: 'demo-game-1' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(fulfillment.fulfillFreeOrder).not.toHaveBeenCalled();
    });

    it('surfaces no_pool_capacity as a sold-out error', async () => {
      vi.mocked(games.findBySlug).mockResolvedValue({
        ...publishedGame,
        discount: freeDiscount,
      } as never);
      vi.mocked(fulfillment.fulfillFreeOrder).mockResolvedValue({
        action: 'no_pool_capacity',
      } as never);

      await expect(
        service.createCheckout({ slug: 'demo-game-1' }, user),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('is idempotent on repeat claims by the same owner', async () => {
      vi.mocked(games.findBySlug).mockResolvedValue({
        ...publishedGame,
        discount: freeDiscount,
      } as never);
      vi.mocked(fulfillment.fulfillFreeOrder).mockResolvedValue({
        action: 'already_fulfilled',
        orderId: 'order-existing',
        licenseId: 'lic-existing',
        sessionId: 'free_existing',
      });

      const result = await service.createCheckout({ slug: 'demo-game-1' }, user);

      expect(result).toEqual({
        sessionId: 'free_existing',
        url: expect.stringContaining('free_existing'),
      });
    });
  });
});
