import {
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '@gamestore/api/auth';
import type { GamesRepository, OrdersRepository } from '@gamestore/api/data-access';
import { StripeConfig, type StripeService } from '@gamestore/api/stripe';
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
  coverImage: 'https://cdn.example.com/cover.jpg',
  publishedAt: new Date('2025-01-01'),
};

describe('PaymentsService', () => {
  const games = {
    findById: vi.fn(),
    findBySlug: vi.fn(),
  } as unknown as GamesRepository;

  const orders = {
    createPending: vi.fn(),
  } as unknown as OrdersRepository;

  const stripe = {
    createCheckoutSession: vi.fn(),
  } as unknown as StripeService;

  let service: PaymentsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PaymentsService(games, orders, stripe);

    vi.spyOn(StripeConfig, 'isCheckoutConfigured').mockReturnValue(true);
    vi.mocked(games.findBySlug).mockResolvedValue(publishedGame as never);
    vi.mocked(stripe.createCheckoutSession).mockResolvedValue({
      sessionId: 'cs_test_abc',
      url: 'https://checkout.stripe.com/pay/cs_test_abc',
    });
    vi.mocked(orders.createPending).mockResolvedValue({ id: 'order-1' } as never);
  });

  it('creates a checkout session and pending order for a published game slug', async () => {
    const result = await service.createCheckout({ slug: 'demo-game-1' }, user);

    expect(stripe.createCheckoutSession).toHaveBeenCalledWith({
      gameId: 'game-1',
      gameSlug: 'demo-game-1',
      title: 'Demo Game',
      priceBase: 19.99,
      coverImage: 'https://cdn.example.com/cover.jpg',
      userId: 'user-a',
      customerEmail: 'buyer@example.com',
    });
    expect(orders.createPending).toHaveBeenCalledWith({
      gameId: 'game-1',
      stripeSessionId: 'cs_test_abc',
      amount: 19.99,
      ownerId: 'user-a',
    });
    expect(result).toEqual({
      sessionId: 'cs_test_abc',
      url: 'https://checkout.stripe.com/pay/cs_test_abc',
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

  it('returns 404 when slug does not match a published game', async () => {
    vi.mocked(games.findBySlug).mockResolvedValue(null);

    await expect(
      service.createCheckout({ slug: 'missing-game' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns 503 when Stripe checkout env is misconfigured', async () => {
    vi.spyOn(StripeConfig, 'isCheckoutConfigured').mockReturnValue(false);

    await expect(
      service.createCheckout({ slug: 'demo-game-1' }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
