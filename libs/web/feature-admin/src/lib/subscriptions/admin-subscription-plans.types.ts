export type AdminSubscriptionPlanListItem = {
  id: string;
  name: string;
  slug: string;
  stripePriceId: string;
  interval: string;
  intervalCount: number;
  isActive: boolean;
  gameCount: number;
};

export type AdminSubscriptionPlanFormValues = {
  name: string;
  slug: string;
  stripePriceId: string;
  interval: string;
  intervalCount: string;
  isActive: boolean;
  gameIds: string[];
};

export const EMPTY_ADMIN_SUBSCRIPTION_PLAN_FORM_VALUES: AdminSubscriptionPlanFormValues =
  {
    name: '',
    slug: '',
    stripePriceId: '',
    interval: 'month',
    intervalCount: '1',
    isActive: true,
    gameIds: [],
  };
