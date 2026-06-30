import { apiGet } from './api-client';
import type { SetupResponse } from './admin.types';

export type AdminAuditQuery = {
  page?: number;
  limit?: number;
  action?: string;
};

export function getAdminAuditLogs(query: AdminAuditQuery = {}) {
  const params = new URLSearchParams();
  if (query.page !== undefined) {
    params.set('page', String(query.page));
  }
  if (query.limit !== undefined) {
    params.set('limit', String(query.limit));
  }
  if (query.action) {
    params.set('action', query.action);
  }
  const suffix = params.size > 0 ? `?${params.toString()}` : '';
  return apiGet<SetupResponse | unknown[]>(`/admin/audit-logs${suffix}`);
}
