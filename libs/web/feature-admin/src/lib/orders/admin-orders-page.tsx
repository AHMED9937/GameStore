import { Container } from '@gamestore/shared/ui';
import { AdminAsyncView } from '../components/admin-async-view';
import { AdminPageShell } from '../components/admin-page-shell';
import type { AdminAsyncState } from '../types/admin-async-state';
import { AdminOrdersHeader } from './admin-orders-header';
import { ADMIN_ORDERS_SETUP_MESSAGE } from './orders.constants';

export type AdminOrdersPageProps = {
  listState?: AdminAsyncState<null>;
};

const DEFAULT_LIST_STATE: AdminAsyncState<null> = {
  status: 'setup',
  message: ADMIN_ORDERS_SETUP_MESSAGE,
};

export function AdminOrdersPage({
  listState = DEFAULT_LIST_STATE,
}: AdminOrdersPageProps) {
  return (
    <Container>
      <AdminPageShell>
        <AdminOrdersHeader />
        <AdminAsyncView state={listState} emptyMessage="No orders yet.">
          {() => null}
        </AdminAsyncView>
      </AdminPageShell>
    </Container>
  );
}
