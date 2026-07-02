import { apiPost } from './api-client';

export type CreateCheckoutInput = {
  gameId?: string;
  slug?: string;
};

export type CreateCheckoutResult = {
  sessionId: string;
  url: string;
};

export type CreateSubscriptionCheckoutInput = {
  planSlug: string;
};

export async function createCheckout(
  input: CreateCheckoutInput,
): Promise<CreateCheckoutResult> {
  return apiPost<CreateCheckoutResult>('/payments/checkout', input);
}

export async function createSubscriptionCheckout(
  input: CreateSubscriptionCheckoutInput,
): Promise<CreateCheckoutResult> {
  return apiPost<CreateCheckoutResult>('/payments/subscription-checkout', input);
}
