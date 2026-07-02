'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Container } from '@gamestore/shared/ui';
import {
  apiErrorMessage,
  bulkDeleteAdminSubscriptionPlans,
  getAdminSubscriptionPlans,
} from '@gamestore/web/data-access';
import { AdminAsyncView } from '../components/admin-async-view';
import { AdminBulkToolbar } from '../components/admin-bulk-toolbar';
import { AdminPageShell } from '../components/admin-page-shell';
import { useAdminRowSelection } from '../components/use-admin-row-selection';
import type { AdminAsyncState } from '../types/admin-async-state';
import { useAdminListState } from '../hooks/use-admin-resource';
import { formatBulkActionSummary } from '../utils/bulk-action-summary';
import { AdminSubscriptionPlansHeader } from './admin-subscription-plans-header';
import { AdminSubscriptionPlansTable } from './admin-subscription-plans-table';
import type { AdminSubscriptionPlanListItem } from './admin-subscription-plans.types';

export type AdminSubscriptionPlansPageProps = {
  listState?: AdminAsyncState<AdminSubscriptionPlanListItem[]>;
};

function parsePlansList(data: unknown): AdminSubscriptionPlanListItem[] {
  return Array.isArray(data) ? (data as AdminSubscriptionPlanListItem[]) : [];
}

export function AdminSubscriptionPlansPage({
  listState,
}: AdminSubscriptionPlansPageProps) {
  const isControlled = listState !== undefined;
  const fetchedState = useAdminListState(
    () => getAdminSubscriptionPlans(),
    parsePlansList,
  );
  const state = listState ?? fetchedState;
  const [plans, setPlans] = useState<AdminSubscriptionPlanListItem[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isControlled && state.status === 'success') {
      setPlans(state.data);
    }
  }, [isControlled, state]);

  const tablePlans =
    isControlled && state.status === 'success' ? state.data : plans;

  const selection = useAdminRowSelection({
    rowIds: tablePlans.map((plan) => plan.id),
    isRowSelectable: () => true,
  });

  const refreshList = useCallback(async () => {
    if (isControlled) {
      return;
    }
    const result = await getAdminSubscriptionPlans();
    setPlans(parsePlansList(result));
  }, [isControlled]);

  const handleBulkDelete = useCallback(async () => {
    if (isControlled || selection.selectedIds.length === 0) {
      return;
    }
    if (
      !window.confirm(
        `Delete ${selection.selectedIds.length} selected plan(s)? This cannot be undone.`,
      )
    ) {
      return;
    }
    setBulkLoading(true);
    setActionError(null);
    setActionMessage(null);
    try {
      const result = await bulkDeleteAdminSubscriptionPlans(selection.selectedIds);
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
        <AdminSubscriptionPlansHeader />
        {actionError ? (
          <p role="alert" data-testid="admin-subscription-plans-action-error">
            {actionError}
          </p>
        ) : null}
        {actionMessage ? (
          <p data-testid="admin-subscription-plans-action-message">{actionMessage}</p>
        ) : null}
        <AdminAsyncView state={state} emptyMessage="No subscription plans yet.">
          {(items) => (
            <>
              {!isControlled && items.length > 0 ? (
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
              <AdminSubscriptionPlansTable
                plans={tablePlans.length > 0 ? tablePlans : items}
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
          )}
        </AdminAsyncView>
      </AdminPageShell>
    </Container>
  );
}
