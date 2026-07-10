import { apiGet, apiPost } from './api-client';
import type { BulkActionResult } from './admin.types';

export type AdminOrderRecord = {
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

export type AdminOrderListFilters = {
  q?: string;
  status?: string;
  orderType?: string;
};

export function getAdminOrders(filters: AdminOrderListFilters = {}) {
  const params = new URLSearchParams();
  if (filters.q) {
    params.set('q', filters.q);
  }
  if (filters.status) {
    params.set('status', filters.status);
  }
  if (filters.orderType) {
    params.set('orderType', filters.orderType);
  }
  const suffix = params.size > 0 ? `?${params.toString()}` : '';
  return apiGet<AdminOrderRecord[]>(`/admin/orders${suffix}`);
}

export function bulkDeleteAdminOrders(ids: string[]) {
  return apiPost<BulkActionResult>('/admin/orders/bulk-delete', { ids });
}
