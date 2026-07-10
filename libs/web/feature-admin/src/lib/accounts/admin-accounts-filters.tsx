'use client';

import { AdminTableFiltersBar } from '../components/admin-table-filters-bar';
import { AdminTableSearchField } from '../components/admin-table-search-field';
import { AdminTableSelectFilter } from '../components/admin-table-select-filter';

export type AdminAccountFilterDraft = {
  q: string;
  status: '' | 'active' | 'inactive';
  platform: string;
};

export type AdminAccountsFiltersProps = {
  draft: AdminAccountFilterDraft;
  disabled?: boolean;
  onDraftChange: (patch: Partial<AdminAccountFilterDraft>) => void;
};

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
] as const;

const PLATFORM_OPTIONS = [
  { value: '', label: 'All platforms' },
  { value: 'steam', label: 'Steam' },
  { value: 'ubisoft', label: 'Ubisoft' },
] as const;

export function AdminAccountsFilters({
  draft,
  disabled = false,
  onDraftChange,
}: AdminAccountsFiltersProps) {
  return (
    <AdminTableFiltersBar testId="admin-accounts-filters">
      <AdminTableSearchField
        label="Search"
        value={draft.q}
        placeholder="Search accounts…"
        disabled={disabled}
        ariaLabel="Filter accounts by username or game"
        onChange={(value) => onDraftChange({ q: value })}
      />
      <AdminTableSelectFilter
        label="Status"
        value={draft.status}
        options={[...STATUS_OPTIONS]}
        disabled={disabled}
        ariaLabel="Filter accounts by status"
        onChange={(value) =>
          onDraftChange({
            status: value as AdminAccountFilterDraft['status'],
          })
        }
      />
      <AdminTableSelectFilter
        label="Platform"
        value={draft.platform}
        options={[...PLATFORM_OPTIONS]}
        disabled={disabled}
        ariaLabel="Filter accounts by platform"
        onChange={(value) => onDraftChange({ platform: value })}
      />
    </AdminTableFiltersBar>
  );
}
