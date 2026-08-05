import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  assertSessionOrderAccess,
  type AuthUser,
} from '@gamestore/api/auth';
import {
  OrdersRepository,
  type CreatePendingOrderInput,
  type MarkOrderCompletedInput,
} from '@gamestore/api/data-access';
import {
  PaymentFulfillmentService,
  type FulfillmentResult,
} from '../payments/payment-fulfillment.service';

export type OrderSummaryDto = {
  id: string;
  amount: string;
  currency: string;
  buyerEmail: string | null;
  createdAt: string;
};

export type OrderLicenseDto = {
  licenseKey: string;
  status: string;
  game: { id: string; title: string; slug: string };
};

export type OrderSessionLookupResponse =
  | {
      status: 'completed';
      order: OrderSummaryDto;
      license: OrderLicenseDto;
    }
  | {
      status: 'pending';
      message: string;
    }
  | {
      status: 'failed';
      message: string;
    };

type OrderWithRelations = NonNullable<
  Awaited<ReturnType<OrdersRepository['findByProviderCheckoutId']>>
>;

@Injectable()
export class OrdersService {
  constructor(
    private readonly orders: OrdersRepository,
    private readonly fulfillment: PaymentFulfillmentService,
  ) {}

  createPending(dto: CreatePendingOrderInput) {
    return this.orders.createPending(dto);
  }

  findByProviderCheckoutId(providerCheckoutId: string) {
    return this.orders.findByProviderCheckoutId(providerCheckoutId);
  }

  findAll() {
    return this.orders.findAll();
  }

  async findOne(id: string) {
    const order = await this.orders.findById(id);
    if (!order) {
      throw new NotFoundException(`No order found with id "${id}"`);
    }
    return order;
  }

  async cancelCheckoutBySession(
    sessionId: string,
    user?: AuthUser,
  ): Promise<OrderSessionLookupResponse> {
    let order = await this.orders.findByProviderCheckoutId(sessionId);
    if (!order) {
      throw new NotFoundException(
        `No order found for session "${sessionId}"`,
      );
    }

    if (order.status === 'pending') {
      await this.fulfillment.cancelPaddleTransaction(sessionId);
      order = await this.orders.findByProviderCheckoutId(sessionId);
      if (!order) {
        throw new NotFoundException(
          `No order found for session "${sessionId}"`,
        );
      }
    }

    assertSessionOrderAccess(
      user,
      order.ownerId,
      'Sign in with the account used to purchase',
    );

    return this.toSessionLookupResponse(order);
  }

  async getCheckoutBySession(
    sessionId: string,
    user?: AuthUser,
  ): Promise<OrderSessionLookupResponse> {
    let order = await this.orders.findByProviderCheckoutId(sessionId);
    if (!order) {
      throw new NotFoundException(
        `No order found for session "${sessionId}"`,
      );
    }

    let pendingMessage: string | undefined;

    if (order.status === 'pending') {
      const syncResult = await this.fulfillment.syncFulfillmentFromPaddle(sessionId);
      order = await this.orders.findByProviderCheckoutId(sessionId);
      if (!order) {
        throw new NotFoundException(
          `No order found for session "${sessionId}"`,
        );
      }
      if (order.status === 'pending') {
        pendingMessage = this.pendingMessageFromSync(syncResult);
      }
    }

    assertSessionOrderAccess(
      user,
      order.ownerId,
      'Sign in with the account used to purchase',
    );

    return this.toSessionLookupResponse(order, pendingMessage);
  }

  markCompleted(id: string, data: MarkOrderCompletedInput) {
    return this.orders.markCompleted(id, data);
  }

  markFailed(providerCheckoutId: string) {
    return this.orders.markFailed(providerCheckoutId);
  }

  private pendingMessageFromSync(sync: FulfillmentResult): string {
    if (sync.action === 'pending_payment') {
      return 'Confirming payment with Paddle…';
    }

    return 'Payment received issuing your license…';
  }

  private toSessionLookupResponse(
    order: OrderWithRelations,
    pendingMessage?: string,
  ): OrderSessionLookupResponse {
    if (order.status === 'pending') {
      return {
        status: 'pending',
        message: pendingMessage ?? 'Payment received issuing your license…',
      };
    }

    if (order.status === 'failed') {
      return {
        status: 'failed',
        message: 'Payment was not completed.',
      };
    }

    if (order.status === 'completed' && order.license) {
      const game = this.resolveOrderGame(order);
      if (!game) {
        throw new NotFoundException(
          `No game details found for completed order "${order.id}"`,
        );
      }

      return {
        status: 'completed',
        order: this.toOrderSummary(order),
        license: {
          licenseKey: order.license.licenseKey,
          status: order.license.status,
          game,
        },
      };
    }

    return {
      status: 'pending',
      message: pendingMessage ?? 'Payment received issuing your license…',
    };
  }

  private resolveOrderGame(
    order: OrderWithRelations & {
      gameId?: string | null;
      gameTitleSnapshot?: string | null;
      gameSlugSnapshot?: string | null;
    },
  ): OrderLicenseDto['game'] | null {
    if (order.game) {
      return order.game;
    }

    if (order.gameTitleSnapshot && order.gameSlugSnapshot) {
      return {
        id: order.gameId ?? '',
        title: order.gameTitleSnapshot,
        slug: order.gameSlugSnapshot,
      };
    }

    return null;
  }

  private toOrderSummary(order: OrderWithRelations): OrderSummaryDto {
    return {
      id: order.id,
      amount: order.amount.toString(),
      currency: order.currency,
      buyerEmail: order.buyerEmail,
      createdAt: order.createdAt.toISOString(),
    };
  }
}
