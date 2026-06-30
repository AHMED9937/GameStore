import { EmptyState } from '@gamestore/shared/ui';

export function AdminAccountsEmpty() {
  return (
    <div data-testid="admin-accounts-empty">
      <EmptyState message="No pool accounts yet." />
    </div>
  );
}
