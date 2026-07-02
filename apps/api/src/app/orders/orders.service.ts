import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  assertOwnedResourceAccess,
  type AuthUser,
} from '@gamestore/api/auth';
import {
  OrdersRepository,
  type CreatePendingOrderInput,
  type MarkOrderCompletedInput,
} from '@gamestore/api/data-access';

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
  Awaited<ReturnType<OrdersRepository['findByStripeSessionId']>>
>;

@Injectable()
export class OrdersService {
  constructor(private readonly orders: OrdersRepository) {}

  createPending(dto: CreatePendingOrderInput) {
    return this.orders.createPending(dto);
  }

  findByStripeSessionId(stripeSessionId: string) {
    return this.orders.findByStripeSessionId(stripeSessionId);
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

  async getCheckoutBySession(
    sessionId: string,
    user?: AuthUser,
  ): Promise<OrderSessionLookupResponse> {
    const order = await this.orders.findByStripeSessionId(sessionId);
    if (!order) {
      throw new NotFoundException(
        `No order found for session "${sessionId}"`,
      );
    }

    assertOwnedResourceAccess(
      user,
      order.ownerId,
      'Sign in with the account used to purchase',
    );

    return this.toSessionLookupResponse(order);
  }

  markCompleted(id: string, data: MarkOrderCompletedInput) {
    return this.orders.markCompleted(id, data);
  }

  markFailed(stripeSessionId: string) {
    return this.orders.markFailed(stripeSessionId);
  }

  private toSessionLookupResponse(
    order: OrderWithRelations,
  ): OrderSessionLookupResponse {
    if (order.status === 'pending') {
      return {
        status: 'pending',
        message: 'Payment received — issuing your license…',
      };
    }

    if (order.status === 'failed') {
      return {
        status: 'failed',
        message: 'Payment was not completed.',
      };
    }

    if (order.status === 'completed' && order.license) {
      return {
        status: 'completed',
        order: this.toOrderSummary(order),
        license: {
          licenseKey: order.license.licenseKey,
          status: order.license.status,
          game: order.game,
        },
      };
    }

    return {
      status: 'pending',
      message: 'Payment received — issuing your license…',
    };
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
