import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthUser } from '@gamestore/api/auth';
import {
  GamesRepository,
  GameAccountsRepository,
  OrdersRepository,
  SubscriptionPlansRepository,
  resolveSoldOut,
} from '@gamestore/api/data-access';
import {
  buildCheckoutUrls,
  PaddleConfig,
  PaddleMisconfiguredError,
  PaddleService,
  type CreateCheckoutTransactionResult,
} from '@gamestore/api/paddle';
import { resolveEffectivePrice } from '@gamestore/shared/pricing';
import { PaymentFulfillmentService } from './payment-fulfillment.service';

export type CreateCheckoutDto = {
  gameId?: string;
  slug?: string;
};

export type CreateSubscriptionCheckoutDto = {
  planSlug: string;
};

export type CreateCheckoutSessionResult = {
  sessionId: string;
  url: string;
};

type PurchasableGame = NonNullable<Awaited<ReturnType<GamesRepository['findById']>>>;

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly games: GamesRepository,
    private readonly gameAccounts: GameAccountsRepository,
    private readonly orders: OrdersRepository,
    private readonly plans: SubscriptionPlansRepository,
    private readonly paddle: PaddleService,
    private readonly fulfillment: PaymentFulfillmentService,
  ) {}

  async createCheckout(
    dto: CreateCheckoutDto,
    user?: AuthUser,
  ): Promise<CreateCheckoutSessionResult> {
    if (!PaddleConfig.isCheckoutConfigured()) {
      throw new ServiceUnavailableException(
        'Payments are temporarily unavailable',
      );
    }

    const game = await this.resolvePurchasableGame(dto);
    const effective = resolveEffectivePrice(
      game.priceBase.toString(),
      game.discount
        ? {
            enabled: game.discount.enabled,
            percentOff: game.discount.percentOff,
            startsAt: game.discount.startsAt,
            endsAt: game.discount.endsAt,
          }
        : null,
    );
    const chargeAmount = effective.isDiscounted
      ? effective.priceSale
      : effective.priceBase;

    if (!Number.isFinite(chargeAmount) || chargeAmount < 0) {
      throw new BadRequestException('Invalid price for this game');
    }

    if (chargeAmount === 0) {
      return this.claimFreeGame(game, user);
    }

    let checkout: CreateCheckoutTransactionResult;
    try {
      checkout = await this.paddle.createCheckoutTransaction({
        gameId: game.id,
        gameSlug: game.slug,
        title: game.title,
        productId: game.paddleProductId,
        priceBase: chargeAmount,
        userId: user?.id,
        customerEmail: user?.email,
      });
    } catch (error) {
      if (error instanceof PaddleMisconfiguredError) {
        throw new ServiceUnavailableException(error.message);
      }
      throw error;
    }

    try {
      await this.orders.createPending({
        gameId: game.id,
        gameTitleSnapshot: game.title,
        gameSlugSnapshot: game.slug,
        providerCheckoutId: checkout.transactionId,
        amount: chargeAmount,
        ownerId: user?.id,
      });
    } catch (error) {
      this.logger.error(
        `Paddle transaction ${checkout.transactionId} created but pending order insert failed for game ${game.id}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }

    return {
      sessionId: checkout.transactionId,
      url: checkout.url,
    };
  }

  /**
   * 100%-off games skip Paddle entirely: grant the license immediately and
   * point the caller at the same success URL a paid checkout would use, so
   * the frontend needs no separate code path.
   */
  private async claimFreeGame(
    game: PurchasableGame,
    user?: AuthUser,
  ): Promise<CreateCheckoutSessionResult> {
    if (!user) {
      throw new UnauthorizedException('Sign in to claim this free game');
    }

    const result = await this.fulfillment.fulfillFreeOrder({
      gameId: game.id,
      gameTitleSnapshot: game.title,
      gameSlugSnapshot: game.slug,
      ownerId: user.id,
      buyerEmail: user.email,
    });

    if (result.action === 'no_pool_capacity') {
      throw new BadRequestException('This game is currently sold out');
    }

    const { successUrl } = buildCheckoutUrls(game.slug);
    return {
      sessionId: result.sessionId,
      url: successUrl.replace('{CHECKOUT_TRANSACTION_ID}', result.sessionId),
    };
  }

  async createSubscriptionCheckout(
    dto: CreateSubscriptionCheckoutDto,
    user?: AuthUser,
  ): Promise<CreateCheckoutSessionResult> {
    if (!user) {
      throw new UnauthorizedException('Sign in to subscribe');
    }

    if (!PaddleConfig.isCheckoutConfigured()) {
      throw new ServiceUnavailableException(
        'Payments are temporarily unavailable',
      );
    }

    const planSlug = dto.planSlug?.trim();
    if (!planSlug) {
      throw new BadRequestException('planSlug is required');
    }

    const plan = await this.plans.findBySlug(planSlug);
    if (!plan || !plan.isActive) {
      throw new NotFoundException(`No active subscription plan found for "${planSlug}"`);
    }

    if (plan.games.length === 0) {
      throw new BadRequestException(
        'This subscription plan has no published games linked yet',
      );
    }

    try {
      const checkout = await this.paddle.createSubscriptionCheckoutTransaction({
        planId: plan.id,
        planSlug: plan.slug,
        planName: plan.name,
        providerPriceId: plan.providerPriceId,
        userId: user.id,
        customerEmail: user.email,
      });

      return {
        sessionId: checkout.transactionId,
        url: checkout.url,
      };
    } catch (error) {
      if (error instanceof PaddleMisconfiguredError) {
        throw new ServiceUnavailableException(error.message);
      }
      throw error;
    }
  }

  private async resolvePurchasableGame(
    dto: CreateCheckoutDto,
  ): Promise<PurchasableGame> {
    const gameId = dto.gameId?.trim();
    const slug = dto.slug?.trim();

    if (!gameId && !slug) {
      throw new BadRequestException('gameId or slug is required');
    }

    if (gameId) {
      const game = await this.games.findById(gameId);
      if (!game) {
        throw new NotFoundException(`No game found with id "${gameId}"`);
      }
      if (!game.publishedAt) {
        throw new BadRequestException(
          'This game is not available for purchase',
        );
      }
      await this.assertGameNotSoldOut(game);
      return game;
    }

    const game = await this.games.findBySlug(slug!);
    if (!game) {
      throw new NotFoundException(`No game found for slug "${slug}"`);
    }

    await this.assertGameNotSoldOut(game);
    return game;
  }

  private async assertGameNotSoldOut(
    game: { id: string; soldOut: boolean },
  ): Promise<void> {
    const poolFlags = await this.gameAccounts.getActivePoolFlagsByGameIds([
      game.id,
    ]);
    const hasOpenCapacity = await this.gameAccounts.hasOpenPoolCapacity(game.id);
    if (
      resolveSoldOut(
        game.soldOut,
        poolFlags.get(game.id) ?? false,
        hasOpenCapacity,
      )
    ) {
      throw new BadRequestException('This game is currently sold out');
    }
  }
}
