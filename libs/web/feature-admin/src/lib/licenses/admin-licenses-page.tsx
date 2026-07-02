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
  type AdminLicenseListRecord,
  type BulkActionResult,
} from '@gamestore/web/data-access';
import { AdminAsyncView } from '../components/admin-async-view';
import { AdminBulkToolbar } from '../components/admin-bulk-toolbar';
import { AdminPageShell } from '../components/admin-page-shell';
import { useAdminRowSelection } from '../components/use-admin-row-selection';
import type { AdminAsyncState } from '../types/admin-async-state';
import { useAdminListState } from '../hooks/use-admin-resource';
import { formatBulkActionSummary } from '../utils/bulk-action-summary';
import { AdminLicensesEmpty } from './admin-licenses-empty';
import { AdminLicensesFilters } from './admin-licenses-filters';
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
  return license.status !== 'revoked' || license.status !== 'activated';
}

export function AdminLicensesPage({ listState }: AdminLicensesPageProps) {
  const isControlled = listState !== undefined;
  const [gameQuery, setGameQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [licenses, setLicenses] = useState<AdminLicenseListItem[]>([]);

  const fetchedState = useAdminListState(() => getAdminLicenses(), parseLicensesList);
  const state = listState ?? fetchedState;

  useEffect(() => {
    if (!isControlled && state.status === 'success') {
      setLicenses(state.data);
    }
  }, [isControlled, state]);

  const sourceLicenses =
    isControlled && state.status === 'success' ? state.data : licenses;

  const filteredLicenses = sourceLicenses.filter((license) => {
    const matchesGame =
      !gameQuery ||
      license.gameTitle.toLowerCase().includes(gameQuery.toLowerCase());
    const matchesStatus =
      !statusFilter ||
      license.status.toLowerCase().includes(statusFilter.toLowerCase());
    return matchesGame && matchesStatus;
  });

  const tableLicenses = filteredLicenses.length > 0 ? filteredLicenses : sourceLicenses;
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
    const result = await getAdminLicenses();
    if (!isSetupResponse(result)) {
      setLicenses(parseLicensesList(result));
    }
  }, [isControlled]);

  const handleBulkResult = useCallback(
    async (result: BulkActionResult, verb: string) => {
      setActionMessage(formatBulkActionSummary(result, verb));
      selection.clearSelection();
      await refreshList();
    },
    [refreshList, selection],
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
    setActionError(null);
    setActionMessage(null);
    try {
      const result = await bulkRevokeAdminLicenses(selection.selectedIds);
      if (isSetupResponse(result)) {
        setActionError(result.message);
        return;
      }
      await handleBulkResult(result, 'revoked');
    } catch (error: unknown) {
      setActionError(apiErrorMessage(error));
    } finally {
      setBulkLoading(false);
    }
  }, [handleBulkResult, isControlled, selection.selectedIds, selection]);

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
    setActionError(null);
    setActionMessage(null);
    try {
      const result = await bulkDeleteAdminLicenses(selection.selectedIds);
      if (isSetupResponse(result)) {
        setActionError(result.message);
        return;
      }
      await handleBulkResult(result, 'deleted');
    } catch (error: unknown) {
      setActionError(apiErrorMessage(error));
    } finally {
      setBulkLoading(false);
    }
  }, [handleBulkResult, isControlled, selection.selectedIds, selection]);

  const handleRevoke = useCallback(
    async (licenseId: string) => {
      if (isControlled) {
        return;
      }
      if (!window.confirm('Revoke this license? Buyers will no longer be able to use it.')) {
        return;
      }

      setRevokingId(licenseId);
      setActionError(null);
      try {
        await revokeAdminLicense(licenseId);
        await refreshList();
      } catch (error: unknown) {
        setActionError(apiErrorMessage(error));
      } finally {
        setRevokingId(null);
      }
    },
    [isControlled, refreshList],
  );

  return (
    <Container>
      <AdminPageShell>
        <AdminLicensesHeader />
        <AdminLicensesFilters
          gameQuery={gameQuery}
          statusQuery={statusFilter}
          disabled={isControlled}
          onGameQueryChange={setGameQuery}
          onStatusQueryChange={setStatusFilter}
        />
        {actionError ? (
          <p role="alert" data-testid="admin-licenses-action-error">
            {actionError}
          </p>
        ) : null}
        {actionMessage ? (
          <p data-testid="admin-licenses-action-message">{actionMessage}</p>
        ) : null}
        <AdminAsyncView state={state} emptyMessage="No licenses issued yet.">
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
                      Revoke selected
                    </Button>
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
                <AdminLicensesTable
                  licenses={tableLicenses.length > 0 ? tableLicenses : items}
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
