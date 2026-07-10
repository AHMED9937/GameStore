export type AdminDashboardActivityItem = {
  id: string;
  action: string;
  resource: string | null;
  resourceId: string | null;
  actorEmail: string | null;
  createdAt: string;
};

export type AdminDashboardStats = {
  publishedGames: number;
  activeLicenses: number;
  poolAccounts: number;
  ordersToday: number;
  recentActivity: AdminDashboardActivityItem[];
};
