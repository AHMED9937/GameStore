import { apiGet, apiPost } from './api-client';

export type PaddleHealthResponse = {
  status: 'ok' | 'misconfigured';
  integration: 'paddle';
  env: {
    apiKey: 'missing' | 'invalid' | 'valid';
    webhookSecret: 'missing' | 'invalid' | 'valid';
    environment: 'missing' | 'invalid' | 'valid';
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

export async function getPaymentsHealth(): Promise<PaddleHealthResponse> {
  return apiGet<PaddleHealthResponse>('/payments/health');
}

export async function createSubscriptionCheckout(
  input: CreateSubscriptionCheckoutInput,
): Promise<CreateCheckoutResult> {
  return apiPost<CreateCheckoutResult>('/payments/subscription-checkout', input);
}
