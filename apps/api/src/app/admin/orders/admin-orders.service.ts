import { Injectable } from '@nestjs/common';
import {
  OrdersRepository,
  maskLicenseKey,
} from '@gamestore/api/data-access';

export type AdminOrderListItemDto = {
  id: string;
  status: string;
  orderType: string;
  amount: string;
  currency: string;
  buyerEmail: string | null;
  ownerEmail: string | null;
  gameTitle: string;
  gameSlug: string;
  licenseKeyMasked: string | null;
  licenseSource: string | null;
  createdAt: string;
};

@Injectable()
export class AdminOrdersService {
  constructor(private readonly orders: OrdersRepository) {}

  async findAll(): Promise<AdminOrderListItemDto[]> {
    const rows = await this.orders.findAll();

    return rows.map((order) => ({
      id: order.id,
      status: order.status,
      orderType: order.orderType,
      amount: order.amount.toString(),
      currency: order.currency,
      buyerEmail: order.buyerEmail,
      ownerEmail: order.owner?.email ?? null,
      gameTitle: order.game.title,
      gameSlug: order.game.slug,
      licenseKeyMasked: order.license
        ? maskLicenseKey(order.license.licenseKey)
        : null,
      licenseSource: order.license?.source ?? null,
      createdAt: order.createdAt.toISOString(),
    }));
  }
}
