'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Container } from '@gamestore/shared/ui';
import {
  apiErrorMessage,
  bulkDeleteAdminSubscriptionPlans,
  getAdminSubscriptionPlans,
  type AdminSubscriptionPlanListFilters,
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
import { AdminSubscriptionPlansHeader } from './admin-subscription-plans-header';
import { AdminSubscriptionPlansTable } from './admin-subscription-plans-table';
import {
  AdminSubscriptionPlansFilters,
  type AdminSubscriptionPlanFilterDraft,
} from './admin-subscription-plans-filters';
import type { AdminSubscriptionPlanListItem } from './admin-subscription-plans.types';

export type AdminSubscriptionPlansPageProps = {
  listState?: AdminAsyncState<AdminSubscriptionPlanListItem[]>;
};

function parsePlansList(data: unknown): AdminSubscriptionPlanListItem[] {
  return Array.isArray(data) ? (data as AdminSubscriptionPlanListItem[]) : [];
}

const emptyPlanFilters: AdminSubscriptionPlanFilterDraft = {
  q: '',
  status: '',
};

export function AdminSubscriptionPlansPage({
  listState,
}: AdminSubscriptionPlansPageProps) {
  const isControlled = listState !== undefined;
  const { draft, setDraft, activeFilters, hasActiveFilters } =
    useAdminListFilters<AdminSubscriptionPlanFilterDraft>({
      initial: emptyPlanFilters,
      textKeys: ['q'],
    });
  const queryFilters = useMemo<AdminSubscriptionPlanListFilters>(
    () => ({
      ...(activeFilters.q ? { q: activeFilters.q } : {}),
      ...(activeFilters.status
        ? {
            status:
              activeFilters.status as AdminSubscriptionPlanListFilters['status'],
          }
        : {}),
    }),
    [activeFilters],
  );
  const { state: fetchedState } = useAdminListState(
    () => getAdminSubscriptionPlans(queryFilters),
    parsePlansList,
    [queryFilters],
  );
  const state = listState ?? fetchedState;
  const [plans, setPlans] = useState<AdminSubscriptionPlanListItem[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const actionFeedback = useAdminActionFeedback();

  useEffect(() => {
    if (!isControlled && state.status === 'success') {
      setPlans(state.data);
    }
  }, [isControlled, state]);

  const tablePlans = resolveAdminTableRows(isControlled, state, plans);

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
    actionFeedback.clearForAction();
    try {
      const result = await bulkDeleteAdminSubscriptionPlans(selection.selectedIds);
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
        <AdminSubscriptionPlansHeader />
        <AdminSubscriptionPlansFilters
          draft={draft}
          disabled={isControlled}
          onDraftChange={(patch) => setDraft(patch)}
        />
        <AdminActionFeedback
          error={actionFeedback.error}
          message={actionFeedback.message}
          isPending={bulkLoading}
          pendingMessage="Deleting selected plans…"
          testIdPrefix="admin-subscription-plans-action"
        />
        <AdminAsyncView
          state={state}
          emptyMessage={
            hasActiveFilters
              ? 'No subscription plans match the current filters.'
              : 'No subscription plans yet.'
          }
        >
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
                    {bulkLoading ? 'Deleting…' : 'Delete selected'}
                  </Button>
                </AdminBulkToolbar>
              ) : null}
              <AdminSubscriptionPlansTable
                plans={tablePlans}
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
