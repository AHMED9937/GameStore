import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthUser } from '@gamestore/api/auth';
import {
  GamesRepository,
  OrdersRepository,
  SubscriptionPlansRepository,
} from '@gamestore/api/data-access';
import {
  StripeConfig,
  StripeMisconfiguredError,
  StripeService,
  type CreateCheckoutSessionResult,
} from '@gamestore/api/stripe';

export type CreateCheckoutDto = {
  gameId?: string;
  slug?: string;
};

export type CreateSubscriptionCheckoutDto = {
  planSlug: string;
};

type PurchasableGame = NonNullable<Awaited<ReturnType<GamesRepository['findById']>>>;

@Injectable()
export class PaymentsService {
  constructor(
    private readonly games: GamesRepository,
    private readonly orders: OrdersRepository,
    private readonly plans: SubscriptionPlansRepository,
    private readonly stripe: StripeService,
  ) {}

  async createCheckout(
    dto: CreateCheckoutDto,
    user?: AuthUser,
  ): Promise<CreateCheckoutSessionResult> {
    if (!StripeConfig.isCheckoutConfigured()) {
      throw new ServiceUnavailableException(
        'Payments are temporarily unavailable',
      );
    }

    const game = await this.resolvePurchasableGame(dto);
    const priceBase = Number(game.priceBase);

    if (!Number.isFinite(priceBase) || priceBase <= 0) {
      throw new BadRequestException('Invalid price for this game');
    }

    let session: CreateCheckoutSessionResult;
    try {
      session = await this.stripe.createCheckoutSession({
        gameId: game.id,
        gameSlug: game.slug,
        title: game.title,
        priceBase,
        coverImage: game.coverImage,
        userId: user?.id,
        customerEmail: user?.email,
      });
    } catch (error) {
      if (error instanceof StripeMisconfiguredError) {
        throw new ServiceUnavailableException(error.message);
      }
      throw error;
    }

    await this.orders.createPending({
      gameId: game.id,
      stripeSessionId: session.sessionId,
      amount: priceBase,
      ownerId: user?.id,
    });

    return session;
  }

  async createSubscriptionCheckout(
    dto: CreateSubscriptionCheckoutDto,
    user?: AuthUser,
  ): Promise<CreateCheckoutSessionResult> {
    if (!user) {
      throw new UnauthorizedException('Sign in to subscribe');
    }

    if (!StripeConfig.isCheckoutConfigured()) {
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
      return await this.stripe.createSubscriptionCheckoutSession({
        planId: plan.id,
        planSlug: plan.slug,
        planName: plan.name,
        stripePriceId: plan.stripePriceId,
        userId: user.id,
        customerEmail: user.email,
      });
    } catch (error) {
      if (error instanceof StripeMisconfiguredError) {
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
      return game;
    }

    const game = await this.games.findBySlug(slug!);
    if (!game) {
      throw new NotFoundException(`No game found for slug "${slug}"`);
    }

    return game;
  }
}
