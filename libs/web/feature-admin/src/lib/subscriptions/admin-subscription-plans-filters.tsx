'use client';

import { AdminTableFiltersBar } from '../components/admin-table-filters-bar';
import { AdminTableSearchField } from '../components/admin-table-search-field';
import { AdminTableSelectFilter } from '../components/admin-table-select-filter';

export type AdminSubscriptionPlanFilterDraft = {
  q: string;
  status: '' | 'active' | 'inactive';
};

export type AdminSubscriptionPlansFiltersProps = {
  draft: AdminSubscriptionPlanFilterDraft;
  disabled?: boolean;
  onDraftChange: (patch: Partial<AdminSubscriptionPlanFilterDraft>) => void;
};

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
] as const;

export function AdminSubscriptionPlansFilters({
  draft,
  disabled = false,
  onDraftChange,
}: AdminSubscriptionPlansFiltersProps) {
  return (
    <AdminTableFiltersBar testId="admin-subscription-plans-filters">
      <AdminTableSearchField
        label="Search"
        value={draft.q}
        placeholder="Search plans…"
        disabled={disabled}
        ariaLabel="Filter subscription plans by name or slug"
        onChange={(value) => onDraftChange({ q: value })}
      />
      <AdminTableSelectFilter
        label="Status"
        value={draft.status}
        options={[...STATUS_OPTIONS]}
        disabled={disabled}
        ariaLabel="Filter subscription plans by status"
        onChange={(value) =>
          onDraftChange({
            status: value as AdminSubscriptionPlanFilterDraft['status'],
          })
        }
      />
    </AdminTableFiltersBar>
  );
}
