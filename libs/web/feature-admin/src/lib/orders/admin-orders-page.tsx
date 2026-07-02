'use client';

import { Container } from '@gamestore/shared/ui';
import { getAdminOrders } from '@gamestore/web/data-access';
import { AdminAsyncView } from '../components/admin-async-view';
import { AdminPageShell } from '../components/admin-page-shell';
import type { AdminAsyncState } from '../types/admin-async-state';
import { useAdminListState } from '../hooks/use-admin-resource';
import { AdminOrdersEmpty } from './admin-orders-empty';
import { AdminOrdersHeader } from './admin-orders-header';
import { AdminOrdersTable } from './admin-orders-table';
import type { AdminOrderListItem } from './admin-orders.types';

export type AdminOrdersPageProps = {
  listState?: AdminAsyncState<AdminOrderListItem[]>;
};

function parseOrdersList(data: unknown): AdminOrderListItem[] {
  return Array.isArray(data) ? (data as AdminOrderListItem[]) : [];
}

export function AdminOrdersPage({ listState }: AdminOrdersPageProps) {
  const fetchedState = useAdminListState(() => getAdminOrders(), parseOrdersList);
  const state = listState ?? fetchedState;

  return (
    <Container>
      <AdminPageShell>
        <AdminOrdersHeader />
        <AdminAsyncView state={state} emptyMessage="No orders yet.">
          {(orders) =>
            orders.length === 0 ? (
              <AdminOrdersEmpty />
            ) : (
              <AdminOrdersTable orders={orders} />
            )
          }
        </AdminAsyncView>
      </AdminPageShell>
    </Container>
  );
}
