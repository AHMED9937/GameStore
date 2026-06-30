'use client';

import { Container } from '@gamestore/shared/ui';
import { getAdminOrders } from '@gamestore/web/data-access';
import { AdminAsyncView } from '../components/admin-async-view';
import { AdminPageShell } from '../components/admin-page-shell';
import type { AdminAsyncState } from '../types/admin-async-state';
import { useAdminSetupState } from '../hooks/use-admin-resource';
import { AdminOrdersHeader } from './admin-orders-header';

export type AdminOrdersPageProps = {
  listState?: AdminAsyncState<null>;
};

export function AdminOrdersPage({ listState }: AdminOrdersPageProps) {
  const fetchedState = useAdminSetupState(() => getAdminOrders());
  const state = listState ?? fetchedState;

  return (
    <Container>
      <AdminPageShell>
        <AdminOrdersHeader />
        <AdminAsyncView state={state} emptyMessage="No orders yet.">
          {() => null}
        </AdminAsyncView>
      </AdminPageShell>
    </Container>
  );
}
