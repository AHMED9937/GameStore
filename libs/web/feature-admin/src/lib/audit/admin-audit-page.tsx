'use client';

import { Container } from '@gamestore/shared/ui';
import { getAdminAuditLogs } from '@gamestore/web/data-access';
import { AdminAsyncView } from '../components/admin-async-view';
import { AdminPageShell } from '../components/admin-page-shell';
import type { AdminAsyncState } from '../types/admin-async-state';
import { useAdminListState } from '../hooks/use-admin-resource';
import { AdminAuditEmpty } from './admin-audit-empty';
import { AdminAuditFilters } from './admin-audit-filters';
import { AdminAuditHeader } from './admin-audit-header';
import { AdminAuditPagination } from './admin-audit-pagination';
import { AdminAuditTable } from './admin-audit-table';
import type { AdminAuditLogItem } from './admin-audit.types';

export type AdminAuditPageProps = {
  listState?: AdminAsyncState<AdminAuditLogItem[]>;
};

function parseAuditList(data: unknown): AdminAuditLogItem[] {
  return Array.isArray(data) ? (data as AdminAuditLogItem[]) : [];
}

export function AdminAuditPage({ listState }: AdminAuditPageProps) {
  const fetchedState = useAdminListState(
    () => getAdminAuditLogs({ page: 1, limit: 10 }),
    parseAuditList,
  );
  const state = listState ?? fetchedState;

  return (
    <Container>
      <AdminPageShell>
        <AdminAuditHeader />
        <AdminAuditFilters />
        <AdminAsyncView state={state} emptyMessage="No audit events yet.">
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
