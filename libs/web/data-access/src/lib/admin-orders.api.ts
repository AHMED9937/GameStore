import { apiGet } from './api-client';
import type { SetupResponse } from './admin.types';

export function getAdminOrders() {
  return apiGet<SetupResponse>('/admin/orders');
}
