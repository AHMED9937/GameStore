import type { AdminDashboardStats } from './dashboard.types';

export const DASHBOARD_STATS = [
  {
    key: 'publishedGames' as const,
    label: 'Published games',
    href: '/admin/games',
  },
  {
    key: 'activeLicenses' as const,
    label: 'Active licenses',
    href: '/admin/licenses',
  },
  {
    key: 'poolAccounts' as const,
    label: 'Pool accounts',
    href: '/admin/accounts',
  },
  {
    key: 'ordersToday' as const,
    label: 'Orders today',
    href: '/admin/orders',
  },
] as const satisfies ReadonlyArray<{
  key: keyof Pick<
    AdminDashboardStats,
    'publishedGames' | 'activeLicenses' | 'poolAccounts' | 'ordersToday'
  >;
  label: string;
  href: string;
}>;

export const DASHBOARD_ACTIVITY_COLUMNS = [
  { key: 'time', header: 'Time' },
  { key: 'actor', header: 'Actor' },
  { key: 'action', header: 'Action' },
  { key: 'resource', header: 'Resource' },
] as const;

const numberFormatter = new Intl.NumberFormat('en-US');

export function formatDashboardStatValue(value: number): string {
  return numberFormatter.format(value);
}

export function formatDashboardActivityTime(iso: string): string {
  return new Date(iso).toLocaleString();
}
