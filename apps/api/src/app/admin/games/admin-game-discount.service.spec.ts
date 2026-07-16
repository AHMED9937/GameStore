import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  GameDiscountsRepository,
  GamesRepository,
} from '@gamestore/api/data-access';
import { AdminGameDiscountService } from './admin-game-discount.service';

const sampleGame = {
  id: 'game-1',
  priceBase: { toString: () => '19.99' },
  discount: null as null | {
    percentOff: number;
    startsAt: Date;
    endsAt: Date;
    showCountdown: boolean;
    enabled: boolean;
  },
};

describe('AdminGameDiscountService', () => {
  const games = {
    findByIdAdmin: vi.fn(),
  } as unknown as GamesRepository;

  const discounts = {
    upsertForGame: vi.fn(),
    disableForGame: vi.fn(),
  } as unknown as GameDiscountsRepository;

  let service: AdminGameDiscountService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AdminGameDiscountService(games, discounts);
    vi.mocked(games.findByIdAdmin).mockResolvedValue(sampleGame as never);
  });

  it('upserts a discount starting now', async () => {
    const endsAt = new Date(Date.now() + 26 * 60 * 60 * 1000);
    vi.mocked(discounts.upsertForGame).mockResolvedValue({
      id: 'disc-1',
      gameId: 'game-1',
      percentOff: 20,
      startsAt: new Date(),
      endsAt,
      showCountdown: true,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const result = await service.upsertDiscount('game-1', {
      percentOff: 20,
      durationDays: 1,
      durationHours: 2,
      showCountdown: true,
    });

    expect(discounts.upsertForGame).toHaveBeenCalledWith(
      'game-1',
      expect.objectContaining({
        percentOff: 20,
        showCountdown: true,
        enabled: true,
      }),
    );
    expect(result.percentOff).toBe(20);
    expect(result.priceSale).toBe('15.99');
    expect(result.status).toBe('active');
  });

  it('throws NotFound when game missing', async () => {
    vi.mocked(games.findByIdAdmin).mockResolvedValue(null);
    await expect(
      service.upsertDiscount('missing', { percentOff: 10, durationDays: 1 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('ends an existing discount', async () => {
    vi.mocked(games.findByIdAdmin).mockResolvedValue({
      ...sampleGame,
      discount: {
        percentOff: 10,
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 86000000),
        showCountdown: true,
        enabled: true,
      },
    } as never);
    vi.mocked(discounts.disableForGame).mockResolvedValue({ count: 1 } as never);

    await expect(service.endDiscount('game-1')).resolves.toEqual({
      id: 'game-1',
      discount: null,
    });
    expect(discounts.disableForGame).toHaveBeenCalledWith('game-1');
  });

  it('rejects ending when no discount exists', async () => {
    await expect(service.endDiscount('game-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
