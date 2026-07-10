import { apiGet, apiPost } from './api-client';

export type StripeHealthResponse = {
  status: 'ok' | 'misconfigured';
  integration: 'stripe';
  env: {
    secretKey: 'missing' | 'invalid' | 'valid';
    webhookSecret: 'missing' | 'invalid' | 'valid';
    publishableKey: 'missing' | 'invalid' | 'valid';
  };
};

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

export async function getPaymentsHealth(): Promise<StripeHealthResponse> {
  return apiGet<StripeHealthResponse>('/payments/health');
}

export async function createSubscriptionCheckout(
  input: CreateSubscriptionCheckoutInput,
): Promise<CreateCheckoutResult> {
  return apiPost<CreateCheckoutResult>('/payments/subscription-checkout', input);
}
