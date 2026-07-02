import { apiGet } from './api-client';

export type PublicSubscriptionPlanGame = {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
};

export type PublicSubscriptionPlan = {
  id: string;
  name: string;
  slug: string;
  interval: string;
  intervalCount: number;
  games: PublicSubscriptionPlanGame[];
};

export function getSubscriptionPlans() {
  return apiGet<PublicSubscriptionPlan[]>('/subscription-plans');
}
