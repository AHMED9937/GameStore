import { apiGet } from './api-client';

export type AdminOrderRecord = {
  id: string;
  status: string;
  amount: string;
  currency: string;
  buyerEmail: string | null;
  ownerEmail: string | null;
  gameTitle: string;
  gameSlug: string;
  licenseKeyMasked: string | null;
  createdAt: string;
};

export function getAdminOrders() {
  return apiGet<AdminOrderRecord[]>('/admin/orders');
}
