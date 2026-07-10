export type AdminSubscriptionPlanStatusFilter = 'active' | 'inactive';

export type AdminSubscriptionPlanListFiltersDto = {
  q?: string;
  status?: AdminSubscriptionPlanStatusFilter;
};
