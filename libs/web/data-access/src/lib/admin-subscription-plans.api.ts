import { apiDelete, apiGet, apiPost, apiPut } from './api-client';

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
  stripePriceId: string;
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
  stripePriceId: string;
  interval: string;
  intervalCount: number;
  isActive: boolean;
  gameCount: number;
};

export type CreateAdminSubscriptionPlanInput = {
  name: string;
  slug?: string;
  stripePriceId: string;
  interval: string;
  intervalCount?: number;
  isActive?: boolean;
  gameIds?: string[];
};

export type UpdateAdminSubscriptionPlanInput = {
  name?: string;
  slug?: string;
  stripePriceId?: string;
  interval?: string;
  intervalCount?: number;
  isActive?: boolean;
  gameIds?: string[];
};

export function getAdminSubscriptionPlans() {
  return apiGet<AdminSubscriptionPlanListRecord[]>('/admin/subscription-plans');
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
