import { apiGet } from './api-client';

export type UserSubscriptionLicenseRecord = {
  id: string;
  licenseKey: string;
  status: string;
  expiresAt: string | null;
  game: {
    id: string;
    title: string;
    slug: string;
    coverImage: string | null;
  };
};

export type UserSubscriptionRecord = {
  id: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  plan: {
    id: string;
    name: string;
    slug: string;
    interval: string;
    intervalCount: number;
  };
  licenses: UserSubscriptionLicenseRecord[];
};

export function getMySubscriptions() {
  return apiGet<UserSubscriptionRecord[]>('/subscriptions/mine');
}
