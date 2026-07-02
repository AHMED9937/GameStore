'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Container } from '@gamestore/shared/ui';
import {
  apiErrorMessage,
  bulkDeleteAdminOrders,
  getAdminOrders,
} from '@gamestore/web/data-access';
import { AdminAsyncView } from '../components/admin-async-view';
import { AdminBulkToolbar } from '../components/admin-bulk-toolbar';
import { AdminPageShell } from '../components/admin-page-shell';
import { useAdminRowSelection } from '../components/use-admin-row-selection';
import type { AdminAsyncState } from '../types/admin-async-state';
import { useAdminListState } from '../hooks/use-admin-resource';
import { formatBulkActionSummary } from '../utils/bulk-action-summary';
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

function canDeleteOrder(order: AdminOrderListItem): boolean {
  return order.status === 'pending' || order.status === 'failed';
}

export function AdminOrdersPage({ listState }: AdminOrdersPageProps) {
  const isControlled = listState !== undefined;
  const fetchedState = useAdminListState(() => getAdminOrders(), parseOrdersList);
  const state = listState ?? fetchedState;
  const [orders, setOrders] = useState<AdminOrderListItem[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isControlled && state.status === 'success') {
      setOrders(state.data);
    }
  }, [isControlled, state]);

  const tableOrders =
    isControlled && state.status === 'success' ? state.data : orders;

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
    setActionError(null);
    setActionMessage(null);
    try {
      const result = await bulkDeleteAdminOrders(selection.selectedIds);
      setActionMessage(formatBulkActionSummary(result, 'deleted'));
      selection.clearSelection();
      await refreshList();
    } catch (error: unknown) {
      setActionError(apiErrorMessage(error));
    } finally {
      setBulkLoading(false);
    }
  }, [isControlled, refreshList, selection]);

  return (
    <Container>
      <AdminPageShell>
        <AdminOrdersHeader />
        {actionError ? (
          <p role="alert" data-testid="admin-orders-action-error">
            {actionError}
          </p>
        ) : null}
        {actionMessage ? (
          <p data-testid="admin-orders-action-message">{actionMessage}</p>
        ) : null}
        <AdminAsyncView state={state} emptyMessage="No orders yet.">
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
                      Delete selected
                    </Button>
                  </AdminBulkToolbar>
                ) : null}
                <AdminOrdersTable
                  orders={tableOrders.length > 0 ? tableOrders : items}
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
