'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Container } from '@gamestore/shared/ui';
import {
  apiErrorMessage,
  bulkDeleteAdminOrders,
  getAdminOrders,
  type AdminOrderListFilters,
} from '@gamestore/web/data-access';
import { AdminActionFeedback } from '../components/admin-action-feedback';
import { AdminAsyncView } from '../components/admin-async-view';
import { AdminBulkToolbar } from '../components/admin-bulk-toolbar';
import { AdminPageShell } from '../components/admin-page-shell';
import { useAdminRowSelection } from '../components/use-admin-row-selection';
import type { AdminAsyncState } from '../types/admin-async-state';
import { useAdminActionFeedback } from '../hooks/use-admin-action-feedback';
import { useAdminListState } from '../hooks/use-admin-resource';
import { useAdminListFilters } from '../hooks/use-admin-list-filters';
import { formatBulkActionSummary } from '../utils/bulk-action-summary';
import { resolveAdminTableRows } from '../utils/resolve-admin-table-rows';
import { AdminOrdersEmpty } from './admin-orders-empty';
import { AdminOrdersHeader } from './admin-orders-header';
import { AdminOrdersTable } from './admin-orders-table';
import {
  AdminOrdersFilters,
  type AdminOrderFilterDraft,
} from './admin-orders-filters';
import type { AdminOrderListItem } from './admin-orders.types';

export type AdminOrdersPageProps = {
  listState?: AdminAsyncState<AdminOrderListItem[]>;
};

function parseOrdersList(data: unknown): AdminOrderListItem[] {
  return Array.isArray(data) ? (data as AdminOrderListItem[]) : [];
}

function canDeleteOrder(order: AdminOrderListItem): boolean {
  return order.status === 'pending' || order.status === 'failed';
}

const emptyOrderFilters: AdminOrderFilterDraft = {
  q: '',
  status: '',
  orderType: '',
};

export function AdminOrdersPage({ listState }: AdminOrdersPageProps) {
  const isControlled = listState !== undefined;
  const { draft, setDraft, activeFilters, hasActiveFilters } =
    useAdminListFilters<AdminOrderFilterDraft>({
      initial: emptyOrderFilters,
      textKeys: ['q'],
    });
  const queryFilters = useMemo<AdminOrderListFilters>(
    () => ({
      ...(activeFilters.q ? { q: activeFilters.q } : {}),
      ...(activeFilters.status ? { status: activeFilters.status } : {}),
      ...(activeFilters.orderType ? { orderType: activeFilters.orderType } : {}),
    }),
    [activeFilters],
  );
  const { state: fetchedState } = useAdminListState(
    () => getAdminOrders(queryFilters),
    parseOrdersList,
    [queryFilters],
  );
  const state = listState ?? fetchedState;
  const [orders, setOrders] = useState<AdminOrderListItem[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const actionFeedback = useAdminActionFeedback();

  useEffect(() => {
    if (!isControlled && state.status === 'success') {
      setOrders(state.data);
    }
  }, [isControlled, state]);

  const tableOrders = resolveAdminTableRows(isControlled, state, orders);

  const orderById = useMemo(
    () => new Map(tableOrders.map((order) => [order.id, order])),
    [tableOrders],
  );

  const selection = useAdminRowSelection({
    rowIds: tableOrders.map((order) => order.id),
    isRowSelectable: (id) => {
      const order = orderById.get(id);
      return order ? canDeleteOrder(order) : false;
    },
  });

  const refreshList = useCallback(async () => {
    if (isControlled) {
      return;
    }
    const result = await getAdminOrders();
    setOrders(parseOrdersList(result));
  }, [isControlled]);

  const handleBulkDelete = useCallback(async () => {
    if (isControlled || selection.selectedIds.length === 0) {
      return;
    }
    if (
      !window.confirm(
        `Delete ${selection.selectedIds.length} selected order(s)? This cannot be undone.`,
      )
    ) {
      return;
    }
    setBulkLoading(true);
    actionFeedback.clearForAction();
    try {
      const result = await bulkDeleteAdminOrders(selection.selectedIds);
      actionFeedback.setMessage(formatBulkActionSummary(result, 'deleted'));
      selection.clearSelection();
      await refreshList();
    } catch (error: unknown) {
      actionFeedback.setError(apiErrorMessage(error));
    } finally {
      setBulkLoading(false);
    }
  }, [actionFeedback, isControlled, refreshList, selection]);

  return (
    <Container>
      <AdminPageShell>
        <AdminOrdersHeader />
        <AdminOrdersFilters
          draft={draft}
          disabled={isControlled}
          onDraftChange={(patch) => setDraft(patch)}
        />
        <AdminActionFeedback
          error={actionFeedback.error}
          message={actionFeedback.message}
          isPending={bulkLoading}
          pendingMessage="Deleting selected orders…"
          testIdPrefix="admin-orders-action"
        />
        <AdminAsyncView
          state={state}
          emptyMessage={
            hasActiveFilters
              ? 'No orders match the current filters.'
              : 'No orders yet.'
          }
        >
          {(items) =>
            items.length === 0 ? (
              <AdminOrdersEmpty />
            ) : (
              <>
                {!isControlled ? (
                  <AdminBulkToolbar
                    selectedCount={selection.selectedCount}
                    onClear={selection.clearSelection}
                    disabled={bulkLoading}
                  >
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={bulkLoading}
                      onClick={() => void handleBulkDelete()}
                    >
                      {bulkLoading ? 'Deleting…' : 'Delete selected'}
                    </Button>
                  </AdminBulkToolbar>
                ) : null}
                <AdminOrdersTable
                  orders={tableOrders}
                  selection={
                    isControlled
                      ? undefined
                      : {
                          ...selection,
                          disabled: bulkLoading,
                        }
                  }
                />
              </>
            )
          }
        </AdminAsyncView>
      </AdminPageShell>
    </Container>
  );
}
