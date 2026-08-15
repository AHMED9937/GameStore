'use client';

import {
  AdminTableFiltersBar,
} from '../components/admin-table-filters-bar';
import {
  AdminTableSearchField,
} from '../components/admin-table-search-field';
import {
  AdminTableSelectFilter,
} from '../components/admin-table-select-filter';

export type AdminLicenseFilterDraft = {
  game: string;
  source: string;
  owner: string;
  status: string;
  expires: '' | 'lifetime' | 'expiring' | 'expired';
};

export type AdminLicensesFiltersProps = {
  draft: AdminLicenseFilterDraft;
  disabled?: boolean;
  onDraftChange: (patch: Partial<AdminLicenseFilterDraft>) => void;
};

const SOURCE_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'admin', label: 'Admin' },
  { value: 'purchase', label: 'Purchase' },
  { value: 'manual', label: 'Manual' },
] as const;

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'available', label: 'Available' },
  { value: 'activated', label: 'Activated' },
  { value: 'revoked', label: 'Revoked' },
] as const;

const EXPIRES_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'lifetime', label: '2 years (default)' },
  { value: 'expiring', label: 'Expiring' },
  { value: 'expired', label: 'Expired' },
] as const;

export function AdminLicensesFilters({
  draft,
  disabled = false,
  onDraftChange,
}: AdminLicensesFiltersProps) {
  return (
    <AdminTableFiltersBar testId="admin-licenses-filters">
      <AdminTableSearchField
        label="Game"
        value={draft.game}
        placeholder="Search game"
        disabled={disabled}
        ariaLabel="Filter licenses by game"
        onChange={(value) => onDraftChange({ game: value })}
      />
      <AdminTableSelectFilter
        label="Source"
        value={draft.source}
        options={[...SOURCE_OPTIONS]}
        disabled={disabled}
        ariaLabel="Filter licenses by source"
        onChange={(value) => onDraftChange({ source: value })}
      />
      <AdminTableSearchField
        label="Owner"
        value={draft.owner}
        placeholder="Search owner"
        disabled={disabled}
        ariaLabel="Filter licenses by owner"
        onChange={(value) => onDraftChange({ owner: value })}
      />
      <AdminTableSelectFilter
        label="Status"
        value={draft.status}
        options={[...STATUS_OPTIONS]}
        disabled={disabled}
        ariaLabel="Filter licenses by status"
        onChange={(value) => onDraftChange({ status: value })}
      />
      <AdminTableSelectFilter
        label="Expires"
        value={draft.expires}
        options={[...EXPIRES_OPTIONS]}
        disabled={disabled}
        ariaLabel="Filter licenses by expiry"
        onChange={(value) =>
          onDraftChange({
            expires: value as AdminLicenseFilterDraft['expires'],
          })
        }
      />
    </AdminTableFiltersBar>
  );
}
