import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrdersRepository,
  maskLicenseKey,
  normalizeEnumFilter,
  normalizeSearchTerm,
} from '@gamestore/api/data-access';
import {
  normalizeBulkIds,
  runBulkIds,
  type BulkActionResult,
} from '../bulk-action.types';
import type { AdminOrderListFiltersDto } from './admin-order-list-filters.dto';

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

  async findAll(filters?: AdminOrderListFiltersDto): Promise<AdminOrderListItemDto[]> {
    const rows = await this.orders.findAll(this.toOrderFilters(filters));

    return rows.map((order) => ({
      id: order.id,
      status: order.status,
      orderType: order.orderType,
      amount: order.amount.toString(),
      currency: order.currency,
      buyerEmail: order.buyerEmail,
      ownerEmail: order.owner?.email ?? null,
      gameTitle: order.game?.title ?? order.gameTitleSnapshot ?? 'Unknown game',
      gameSlug: order.game?.slug ?? order.gameSlugSnapshot ?? '—',
      licenseKeyMasked: order.license
        ? maskLicenseKey(order.license.licenseKey)
        : null,
      licenseSource: order.license?.source ?? null,
      createdAt: order.createdAt.toISOString(),
    }));
  }

  private toOrderFilters(filters?: AdminOrderListFiltersDto): {
    q?: string;
    status?: string;
    orderType?: string;
  } {
    const q = normalizeSearchTerm(filters?.q);
    const status = normalizeSearchTerm(filters?.status)?.toLowerCase();
    const orderType = normalizeSearchTerm(filters?.orderType)?.toLowerCase();
    return {
      ...(q ? { q } : {}),
      ...(status ? { status } : {}),
      ...(orderType ? { orderType } : {}),
    };
  }

  async bulkDelete(ids: string[]): Promise<BulkActionResult> {
    const normalized = normalizeBulkIds(ids);
    return runBulkIds(normalized, async (id) => {
      const order = await this.orders.findById(id);
      if (!order) {
        throw new NotFoundException(`No order found with id "${id}"`);
      }
      if (order.status === 'completed') {
        throw new BadRequestException('Cannot delete completed order');
      }
      if (order.status !== 'pending' && order.status !== 'failed') {
        throw new BadRequestException(
          `Cannot delete order with status "${order.status}"`,
        );
      }
      await this.orders.deleteById(id);
    });
  }
}
