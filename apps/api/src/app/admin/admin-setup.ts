export type AdminSetupIntegration =
  | 'admin-dashboard'
  | 'admin-games'
  | 'admin-licenses'
  | 'admin-accounts'
  | 'admin-orders'
  | 'admin-audit'
  | 'admin-igdb';

export type AdminSetupResponse = {
  status: 'setup';
  integration: AdminSetupIntegration;
  message: string;
};

export function adminSetupResponse(
  integration: AdminSetupIntegration,
  message: string,
): AdminSetupResponse {
  return {
    status: 'setup',
    integration,
    message,
  };
}
