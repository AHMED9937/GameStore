import { apiPost } from './api-client';
import type { SetupResponse } from './licenses.api';

export async function requestSteamGuardCode(
  licenseKey?: string,
): Promise<SetupResponse> {
  return apiPost<SetupResponse>('/steam/guard-code', { licenseKey });
}
