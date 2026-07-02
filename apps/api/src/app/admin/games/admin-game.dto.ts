export type AdminGameMediaDto = {
  id: string;
  type: string;
  url: string;
  title: string | null;
  sortOrder: number;
  igdbId: number | null;
};

export type AdminGameAccountSummary = {
  total: number;
  active: number;
  hasActivePool: boolean;
};

export type AdminReadinessCheck = {
  id: string;
  label: string;
  passed: boolean;
  required: boolean;
};

export type AdminGameReadinessDto = {
  ready: boolean;
  canPublish: boolean;
  checks: AdminReadinessCheck[];
};
