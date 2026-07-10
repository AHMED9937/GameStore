import { apiGet } from './api-client';
import type { SetupResponse } from './admin.types';

export type AdminAuditQuery = {
  page?: number;
  limit?: number;
  q?: string;
};

export type AdminAuditLogRecord = {
  id: string;
  createdAt: string;
  actorEmail: string;
  action: string;
  resource: string;
};

export type AdminAuditLogListResponse = {
  items: AdminAuditLogRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export function getAdminAuditLogs(query: AdminAuditQuery = {}) {
  const params = new URLSearchParams();
  if (query.page !== undefined) {
    params.set('page', String(query.page));
  }
  if (query.limit !== undefined) {
    params.set('limit', String(query.limit));
  }
  if (query.q) {
    params.set('q', query.q);
  }
  const suffix = params.size > 0 ? `?${params.toString()}` : '';
  return apiGet<SetupResponse | AdminAuditLogListResponse>(
    `/admin/audit-logs${suffix}`,
  );
}
