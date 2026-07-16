import {
  computeEndsAt,
  formatPriceAmount,
  resolveEffectivePrice,
} from '@gamestore/shared/pricing';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  GameDiscountsRepository,
  GamesRepository,
} from '@gamestore/api/data-access';
import {
  toAdminGameDiscountDto,
  type AdminGameDiscountDto,
} from '../../games/game-discount.mapper';
import { parseUpsertGameDiscountBody } from './parse-game-discount.dto';

@Injectable()
export class AdminGameDiscountService {
  constructor(
    private readonly games: GamesRepository,
    private readonly discounts: GameDiscountsRepository,
  ) {}

  async getDiscount(gameId: string): Promise<AdminGameDiscountDto | null> {
    const game = await this.games.findByIdAdmin(gameId);
    if (!game) {
      throw new NotFoundException(`Game ${gameId} not found`);
    }
    if (!game.discount) {
      return null;
    }
    return toAdminGameDiscountDto(game.discount, game.priceBase.toString());
  }

  async upsertDiscount(
    gameId: string,
    body: Record<string, unknown>,
  ): Promise<AdminGameDiscountDto> {
    const game = await this.games.findByIdAdmin(gameId);
    if (!game) {
      throw new NotFoundException(`Game ${gameId} not found`);
    }

    const parsed = parseUpsertGameDiscountBody(body, game.priceBase.toString());
    const startsAt = new Date();
    const endsAt = computeEndsAt(startsAt, {
      days: parsed.durationDays,
      hours: parsed.durationHours,
    });

    const row = await this.discounts.upsertForGame(gameId, {
      percentOff: parsed.percentOff,
      startsAt,
      endsAt,
      showCountdown: parsed.showCountdown,
      enabled: parsed.enabled,
    });

    return toAdminGameDiscountDto(row, game.priceBase.toString());
  }

  async endDiscount(gameId: string): Promise<{ id: string; discount: null }> {
    const game = await this.games.findByIdAdmin(gameId);
    if (!game) {
      throw new NotFoundException(`Game ${gameId} not found`);
    }

    if (!game.discount) {
      throw new BadRequestException('Game has no discount to end');
    }

    await this.discounts.disableForGame(gameId);
    return { id: gameId, discount: null };
  }

  /** Preview helpers for tests / callers. */
  previewSalePrice(priceBase: string, percentOff: number): string {
    const effective = resolveEffectivePrice(priceBase, {
      enabled: true,
      percentOff,
      startsAt: new Date(0),
      endsAt: new Date('9999-01-01'),
    });
    return formatPriceAmount(effective.priceSale);
  }
}
