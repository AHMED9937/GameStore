export type AdminGameStatusFilter = 'published' | 'draft' | 'sold_out';

export type AdminGameListFiltersDto = {
  q?: string;
  platform?: string;
  status?: AdminGameStatusFilter;
};
