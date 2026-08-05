import { apiDelete, apiGet, apiPost, apiPut } from './api-client';
import type { BulkActionResult } from './admin.types';

export type AdminSubscriptionPlanGameRecord = {
  id: string;
  title: string;
  slug: string;
  published: boolean;
};

export type AdminSubscriptionPlanRecord = {
  id: string;
  name: string;
  slug: string;
  providerPriceId: string;
  interval: string;
  intervalCount: number;
  isActive: boolean;
  games: AdminSubscriptionPlanGameRecord[];
  createdAt: string;
  updatedAt: string;
};

export type AdminSubscriptionPlanListRecord = {
  id: string;
  name: string;
  slug: string;
  providerPriceId: string;
  interval: string;
  intervalCount: number;
  isActive: boolean;
  gameCount: number;
};

export type CreateAdminSubscriptionPlanInput = {
  name: string;
  slug?: string;
  providerPriceId: string;
  interval: string;
  intervalCount?: number;
  isActive?: boolean;
  gameIds?: string[];
};

export type UpdateAdminSubscriptionPlanInput = {
  name?: string;
  slug?: string;
  providerPriceId?: string;
  interval?: string;
  intervalCount?: number;
  isActive?: boolean;
  gameIds?: string[];
};

export type AdminSubscriptionPlanListFilters = {
  q?: string;
  status?: 'active' | 'inactive';
};

export function getAdminSubscriptionPlans(
  filters: AdminSubscriptionPlanListFilters = {},
) {
  const params = new URLSearchParams();
  if (filters.q) {
    params.set('q', filters.q);
  }
  if (filters.status) {
    params.set('status', filters.status);
  }
  const suffix = params.size > 0 ? `?${params.toString()}` : '';
  return apiGet<AdminSubscriptionPlanListRecord[]>(
    `/admin/subscription-plans${suffix}`,
  );
}

export function getAdminSubscriptionPlan(id: string) {
  return apiGet<AdminSubscriptionPlanRecord>(`/admin/subscription-plans/${id}`);
}

export function createAdminSubscriptionPlan(body: CreateAdminSubscriptionPlanInput) {
  return apiPost<AdminSubscriptionPlanRecord>('/admin/subscription-plans', body);
}

export function updateAdminSubscriptionPlan(
  id: string,
  body: UpdateAdminSubscriptionPlanInput,
) {
  return apiPut<AdminSubscriptionPlanRecord>(`/admin/subscription-plans/${id}`, body);
}

export function deleteAdminSubscriptionPlan(id: string) {
  return apiDelete<{ id: string; deleted: true }>(`/admin/subscription-plans/${id}`);
}

export function bulkDeleteAdminSubscriptionPlans(ids: string[]) {
  return apiPost<BulkActionResult>('/admin/subscription-plans/bulk-delete', {
    ids,
  });
}
