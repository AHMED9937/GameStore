import { apiPost } from './api-client';

export type SteamGuardCodeResponse = {
  code: string;
  expiresInSeconds: number;
  sharedSecret: string;
};

export async function requestSteamGuardCode(
  licenseKey: string,
): Promise<SteamGuardCodeResponse> {
  return apiPost<SteamGuardCodeResponse>('/steam/guard-code', { licenseKey });
}
