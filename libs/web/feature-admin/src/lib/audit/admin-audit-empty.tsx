import { EmptyState } from '@gamestore/shared/ui';

export function AdminAuditEmpty() {
  return (
    <div data-testid="admin-audit-empty">
      <EmptyState message="No audit events yet." />
    </div>
  );
}
