'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Container } from '@gamestore/shared/ui';
import {
  getAdminAuditLogs,
  isSetupResponse,
  type AdminAuditLogListResponse,
} from '@gamestore/web/data-access';
import { AdminAsyncView } from '../components/admin-async-view';
import { AdminPageShell } from '../components/admin-page-shell';
import type { AdminAsyncState } from '../types/admin-async-state';
import { useAdminListFilters } from '../hooks/use-admin-list-filters';
import { AdminAuditEmpty } from './admin-audit-empty';
import {
  AdminAuditFilters,
  type AdminAuditFilterDraft,
} from './admin-audit-filters';
import { AdminAuditHeader } from './admin-audit-header';
import { AdminAuditPagination } from './admin-audit-pagination';
import { AdminAuditTable } from './admin-audit-table';
import type { AdminAuditLogItem } from './admin-audit.types';

export type AdminAuditPageProps = {
  listState?: AdminAsyncState<AdminAuditLogItem[]>;
};

const PAGE_SIZE = 20;

const emptyAuditFilters: AdminAuditFilterDraft = {
  q: '',
};

function toListItems(response: AdminAuditLogListResponse): AdminAuditLogItem[] {
  return response.items.map((item) => ({
    id: item.id,
    createdAt: item.createdAt,
    actorEmail: item.actorEmail,
    action: item.action,
    resource: item.resource,
  }));
}

export function AdminAuditPage({ listState }: AdminAuditPageProps) {
  const isControlled = listState !== undefined;
  const [page, setPage] = useState(1);
  const [logs, setLogs] = useState<AdminAuditLogItem[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(!isControlled);
  const [error, setError] = useState<string | null>(null);
  const [setupMessage, setSetupMessage] = useState<string | null>(null);
  const { draft, setDraft, activeFilters, hasActiveFilters } =
    useAdminListFilters<AdminAuditFilterDraft>({
      initial: emptyAuditFilters,
      textKeys: ['q'],
    });

  const loadLogs = useCallback(async () => {
    if (isControlled) {
      return;
    }
    setLoading(true);
    setError(null);
    setSetupMessage(null);
    try {
      const result = await getAdminAuditLogs({
        page,
        limit: PAGE_SIZE,
        ...(activeFilters.q ? { q: activeFilters.q } : {}),
      });
      if (isSetupResponse(result)) {
        setSetupMessage(result.message);
        setLogs([]);
        setTotalPages(0);
        return;
      }
      setLogs(toListItems(result));
      setTotalPages(result.totalPages);
    } catch (loadError: unknown) {
      setError(
        loadError instanceof Error ? loadError.message : 'Failed to load audit log.',
      );
      setLogs([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [activeFilters.q, isControlled, page]);

  useEffect(() => {
    setPage(1);
  }, [activeFilters.q]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const state = useMemo<AdminAsyncState<AdminAuditLogItem[]>>(() => {
    if (listState) {
      return listState;
    }
    if (setupMessage) {
      return { status: 'setup', message: setupMessage };
    }
    if (loading) {
      return { status: 'loading' };
    }
    if (error) {
      return { status: 'error', message: error };
    }
    if (logs.length === 0) {
      return { status: 'empty' };
    }
    return { status: 'success', data: logs };
  }, [error, listState, loading, logs, setupMessage]);

  return (
    <Container>
      <AdminPageShell>
        <AdminAuditHeader />
        <AdminAuditFilters
          draft={draft}
          disabled={isControlled}
          onDraftChange={(patch) => setDraft(patch)}
        />
        <AdminAsyncView
          state={state}
          emptyMessage={
            hasActiveFilters
              ? 'No audit events match the current filters.'
              : 'No audit events yet.'
          }
          onRetry={isControlled ? undefined : () => void loadLogs()}
          isRetrying={loading}
        >
          {(items) =>
            items.length === 0 ? (
              <AdminAuditEmpty />
            ) : (
              <AdminAuditTable logs={items} />
            )
          }
        </AdminAsyncView>
        {!isControlled && !setupMessage ? (
          <AdminAuditPagination
            page={page}
            totalPages={totalPages}
            disabled={loading}
            onPrevious={() => setPage((current) => Math.max(1, current - 1))}
            onNext={() =>
              setPage((current) =>
                totalPages > 0 ? Math.min(totalPages, current + 1) : current + 1,
              )
            }
          />
        ) : null}
      </AdminPageShell>
    </Container>
  );
}
