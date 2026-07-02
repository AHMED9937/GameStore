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

export function getAdminOrders() {
  return apiGet<AdminOrderRecord[]>('/admin/orders');
}

export function bulkDeleteAdminOrders(ids: string[]) {
  return apiPost<BulkActionResult>('/admin/orders/bulk-delete', { ids });
}
