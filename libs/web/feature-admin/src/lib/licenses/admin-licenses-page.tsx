'use client';

import { useCallback, useEffect, useState } from 'react';
import { Container, Text } from '@gamestore/shared/ui';
import {
  apiErrorMessage,
  getAdminLicenses,
  isSetupResponse,
  revokeAdminLicense,
  type AdminLicenseListRecord,
} from '@gamestore/web/data-access';
import { AdminAsyncView } from '../components/admin-async-view';
import { AdminPageShell } from '../components/admin-page-shell';
import type { AdminAsyncState } from '../types/admin-async-state';
import { useAdminListState } from '../hooks/use-admin-resource';
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

export function AdminLicensesPage({ listState }: AdminLicensesPageProps) {
  const isControlled = listState !== undefined;
  const [gameQuery, setGameQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
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
        const result = await getAdminLicenses();
        if (!isSetupResponse(result)) {
          setLicenses(parseLicensesList(result));
        }
      } catch (error: unknown) {
        setActionError(apiErrorMessage(error));
      } finally {
        setRevokingId(null);
      }
    },
    [isControlled],
  );

  const tableLicenses = filteredLicenses.length > 0 ? filteredLicenses : sourceLicenses;

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
        <AdminAsyncView state={state} emptyMessage="No licenses issued yet.">
          {(items) =>
            items.length === 0 ? (
              <AdminLicensesEmpty />
            ) : (
              <AdminLicensesTable
                licenses={tableLicenses.length > 0 ? tableLicenses : items}
                revokingId={revokingId}
                onRevoke={isControlled ? undefined : handleRevoke}
              />
            )
          }
        </AdminAsyncView>
      </AdminPageShell>
    </Container>
  );
}
