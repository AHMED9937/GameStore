export type AdminAccountListItem = {
  id: string;
  gameTitle: string;
  username: string;
  platform: string;
  region: string;
  activeUsersCount: number;
  maxActiveUsers: number;
  isActive: boolean;
};

export type AdminAccountFormValues = {
  gameId: string;
  gameTitle: string;
  username: string;
  platform: string;
  region: string;
  maxActiveUsers: string;
  password: string;
  sharedSecret: string;
};

export const EMPTY_ADMIN_ACCOUNT_FORM_VALUES: AdminAccountFormValues = {
  gameId: '',
  gameTitle: '',
  username: '',
  platform: 'steam',
  region: 'global',
  maxActiveUsers: '50',
  password: '',
  sharedSecret: '',
};
