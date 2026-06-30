import { apiPost } from './api-client';
import type { SetupResponse } from './licenses.api';

export async function createCheckout(): Promise<SetupResponse> {
  return apiPost<SetupResponse>('/payments/checkout');
}
