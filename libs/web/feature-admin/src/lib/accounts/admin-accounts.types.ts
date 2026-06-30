export type AdminAccountListItem = {
  id: string;
  gameTitle: string;
  username: string;
  platform: string;
  region: string;
  activeUsersCount: number;
  isActive: boolean;
};

export type AdminAccountFormValues = {
  gameId: string;
  username: string;
  platform: string;
  region: string;
  password: string;
  sharedSecret: string;
};
