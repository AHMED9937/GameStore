export const ADMIN_SUBSCRIPTION_PLAN_COLUMNS = [
  { key: 'name', header: 'Plan' },
  { key: 'slug', header: 'Slug' },
  { key: 'interval', header: 'Billing' },
  { key: 'games', header: 'Games' },
  { key: 'status', header: 'Status' },
  { key: 'actions', header: 'Actions' },
] as const;

export const SUBSCRIPTION_INTERVAL_OPTIONS = [
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' },
  { value: 'week', label: 'Weekly' },
  { value: 'day', label: 'Daily' },
] as const;
