import { apiGet } from './api-client';
import type { SetupResponse } from './admin.types';

export function getAdminStats() {
  return apiGet<SetupResponse>('/admin/stats');
}
