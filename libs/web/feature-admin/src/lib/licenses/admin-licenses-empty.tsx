import { EmptyState } from '@gamestore/shared/ui';

export function AdminLicensesEmpty() {
  return (
    <div data-testid="admin-licenses-empty">
      <EmptyState message="No licenses issued yet." />
    </div>
  );
}
