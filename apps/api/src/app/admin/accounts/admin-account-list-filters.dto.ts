export type AdminAccountStatusFilter = 'active' | 'inactive';

export type AdminAccountListFiltersDto = {
  q?: string;
  status?: AdminAccountStatusFilter;
  platform?: string;
  gameId?: string;
  available?: string;
};
