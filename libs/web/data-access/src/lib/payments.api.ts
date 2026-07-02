import { apiPost } from './api-client';

export type CreateCheckoutInput = {
  gameId?: string;
  slug?: string;
};

export type CreateCheckoutResult = {
  sessionId: string;
  url: string;
};

export async function createCheckout(
  input: CreateCheckoutInput,
): Promise<CreateCheckoutResult> {
  return apiPost<CreateCheckoutResult>('/payments/checkout', input);
}
