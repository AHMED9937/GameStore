import { Container } from '@gamestore/shared/ui';
import { AdminAsyncView } from '../components/admin-async-view';
import { AdminPageShell } from '../components/admin-page-shell';
import type { AdminAsyncState } from '../types/admin-async-state';
import { AdminAuditEmpty } from './admin-audit-empty';
import { AdminAuditFilters } from './admin-audit-filters';
import { AdminAuditHeader } from './admin-audit-header';
import { AdminAuditPagination } from './admin-audit-pagination';
import { AdminAuditTable } from './admin-audit-table';
import type { AdminAuditLogItem } from './admin-audit.types';
import { ADMIN_AUDIT_SETUP_MESSAGE } from './audit.constants';

export type AdminAuditPageProps = {
  listState?: AdminAsyncState<AdminAuditLogItem[]>;
};

const DEFAULT_LIST_STATE: AdminAsyncState<AdminAuditLogItem[]> = {
  status: 'setup',
  message: ADMIN_AUDIT_SETUP_MESSAGE,
};

export function AdminAuditPage({
  listState = DEFAULT_LIST_STATE,
}: AdminAuditPageProps) {
  return (
    <Container>
      <AdminPageShell>
        <AdminAuditHeader />
        <AdminAuditFilters />
        <AdminAsyncView state={listState} emptyMessage="No audit events yet.">
          {(logs) =>
            logs.length === 0 ? (
              <AdminAuditEmpty />
            ) : (
              <AdminAuditTable logs={logs} />
            )
          }
        </AdminAsyncView>
        <AdminAuditPagination />
      </AdminPageShell>
    </Container>
  );
}
