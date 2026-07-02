import { EmptyState } from '@gamestore/shared/ui';

export function AdminOrdersEmpty() {
  return (
    <div data-testid="admin-orders-empty">
      <EmptyState message="No orders yet." />
    </div>
  );
}
