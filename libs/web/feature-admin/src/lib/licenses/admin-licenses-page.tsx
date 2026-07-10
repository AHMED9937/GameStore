'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Container } from '@gamestore/shared/ui';
import {
  apiErrorMessage,
  bulkDeleteAdminLicenses,
  bulkRevokeAdminLicenses,
  getAdminLicenses,
  isSetupResponse,
  revokeAdminLicense,
  type AdminLicenseListFilters,
  type AdminLicenseListRecord,
  type BulkActionResult,
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
import { AdminLicensesEmpty } from './admin-licenses-empty';
import {
  AdminLicensesFilters,
  type AdminLicenseFilterDraft,
} from './admin-licenses-filters';
import { AdminLicensesHeader } from './admin-licenses-header';
import { AdminLicensesTable } from './admin-licenses-table';
import type { AdminLicenseListItem } from './admin-licenses.types';

export type AdminLicensesPageProps = {
  listState?: AdminAsyncState<AdminLicenseListItem[]>;
};

function toListItem(license: AdminLicenseListRecord): AdminLicenseListItem {
  return {
    id: license.id,
    licenseKeyMasked: license.licenseKeyMasked,
    gameTitle: license.gameTitle,
    ownerEmail: license.ownerEmail,
    status: license.status,
    source: license.source,
    expiresAt: license.expiresAt,
  };
}

function parseLicensesList(data: unknown): AdminLicenseListItem[] {
  return Array.isArray(data)
    ? (data as AdminLicenseListRecord[]).map(toListItem)
    : [];
}

function canSelectLicense(license: AdminLicenseListItem): boolean {
  return license.status !== 'revoked' && license.status !== 'activated';
}

const emptyLicenseFilters: AdminLicenseFilterDraft = {
  game: '',
  source: '',
  owner: '',
  status: '',
  expires: '',
};

export function AdminLicensesPage({ listState }: AdminLicensesPageProps) {
  const isControlled = listState !== undefined;
  const { draft, setDraft, activeFilters: appliedFilters, hasActiveFilters } =
    useAdminListFilters<AdminLicenseFilterDraft>({
      initial: emptyLicenseFilters,
      textKeys: ['game', 'owner'],
    });
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const actionFeedback = useAdminActionFeedback();
  const [licenses, setLicenses] = useState<AdminLicenseListItem[]>([]);
  const activeFilters = useMemo<AdminLicenseListFilters>(
    () => ({
      ...(appliedFilters.game ? { game: appliedFilters.game } : {}),
      ...(appliedFilters.source ? { source: appliedFilters.source } : {}),
      ...(appliedFilters.owner ? { owner: appliedFilters.owner } : {}),
      ...(appliedFilters.status ? { status: appliedFilters.status } : {}),
      ...(appliedFilters.expires
        ? {
            expires:
              appliedFilters.expires as AdminLicenseListFilters['expires'],
          }
        : {}),
    }),
    [appliedFilters],
  );

  const { state: fetchedState } = useAdminListState(
    () => getAdminLicenses(activeFilters),
    parseLicensesList,
    [activeFilters],
  );
  const state = listState ?? fetchedState;

  useEffect(() => {
    if (!isControlled && state.status === 'success') {
      setLicenses(state.data);
    }
  }, [isControlled, state]);

  const tableLicenses = resolveAdminTableRows(isControlled, state, licenses);
  const licenseById = useMemo(
    () => new Map(tableLicenses.map((license) => [license.id, license])),
    [tableLicenses],
  );

  const selection = useAdminRowSelection({
    rowIds: tableLicenses.map((license) => license.id),
    isRowSelectable: (id) => {
      const license = licenseById.get(id);
      return license ? canSelectLicense(license) : false;
    },
  });

  const refreshList = useCallback(async () => {
    if (isControlled) {
      return;
    }
    const result = await getAdminLicenses(activeFilters);
    if (!isSetupResponse(result)) {
      setLicenses(parseLicensesList(result));
    }
  }, [activeFilters, isControlled]);

  const handleBulkResult = useCallback(
    async (result: BulkActionResult, verb: string) => {
      actionFeedback.setMessage(formatBulkActionSummary(result, verb));
      selection.clearSelection();
      await refreshList();
    },
    [actionFeedback, refreshList, selection],
  );

  const handleBulkRevoke = useCallback(async () => {
    if (isControlled || selection.selectedIds.length === 0) {
      return;
    }
    if (
      !window.confirm(
        `Revoke ${selection.selectedIds.length} selected license(s)?`,
      )
    ) {
      return;
    }
    setBulkLoading(true);
    actionFeedback.clearForAction();
    try {
      const result = await bulkRevokeAdminLicenses(selection.selectedIds);
      if (isSetupResponse(result)) {
        actionFeedback.setError(result.message);
        return;
      }
      await handleBulkResult(result, 'revoked');
    } catch (error: unknown) {
      actionFeedback.setError(apiErrorMessage(error));
    } finally {
      setBulkLoading(false);
    }
  }, [actionFeedback, handleBulkResult, isControlled, selection.selectedIds, selection]);

  const handleBulkDelete = useCallback(async () => {
    if (isControlled || selection.selectedIds.length === 0) {
      return;
    }
    if (
      !window.confirm(
        `Delete ${selection.selectedIds.length} selected license(s)? This cannot be undone.`,
      )
    ) {
      return;
    }
    setBulkLoading(true);
    actionFeedback.clearForAction();
    try {
      const result = await bulkDeleteAdminLicenses(selection.selectedIds);
      if (isSetupResponse(result)) {
        actionFeedback.setError(result.message);
        return;
      }
      await handleBulkResult(result, 'deleted');
    } catch (error: unknown) {
      actionFeedback.setError(apiErrorMessage(error));
    } finally {
      setBulkLoading(false);
    }
  }, [actionFeedback, handleBulkResult, isControlled, selection.selectedIds, selection]);

  const handleRevoke = useCallback(
    async (licenseId: string) => {
      if (isControlled) {
        return;
      }
      if (!window.confirm('Revoke this license? Buyers will no longer be able to use it.')) {
        return;
      }

      setRevokingId(licenseId);
      actionFeedback.clearForAction();
      try {
        await revokeAdminLicense(licenseId);
        actionFeedback.setMessage('License revoked.');
        await refreshList();
      } catch (error: unknown) {
        actionFeedback.setError(apiErrorMessage(error));
      } finally {
        setRevokingId(null);
      }
    },
    [actionFeedback, isControlled, refreshList],
  );

  return (
    <Container>
      <AdminPageShell>
        <AdminLicensesHeader />
        <AdminLicensesFilters
          draft={draft}
          disabled={isControlled}
          onDraftChange={(patch) => setDraft(patch)}
        />
        <AdminActionFeedback
          error={actionFeedback.error}
          message={actionFeedback.message}
          isPending={bulkLoading || revokingId !== null}
          pendingMessage={bulkLoading ? 'Applying bulk action…' : 'Revoking license…'}
          testIdPrefix="admin-licenses-action"
        />
        <AdminAsyncView
          state={state}
          emptyMessage={
            hasActiveFilters
              ? 'No licenses match the current filters.'
              : 'No licenses issued yet.'
          }
        >
          {(items) =>
            items.length === 0 ? (
              <AdminLicensesEmpty />
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
                      onClick={() => void handleBulkRevoke()}
                    >
                      {bulkLoading ? 'Revoking…' : 'Revoke selected'}
                    </Button>
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
                <AdminLicensesTable
                  licenses={tableLicenses}
                  revokingId={revokingId}
                  onRevoke={isControlled ? undefined : handleRevoke}
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
