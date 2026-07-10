'use client';

import { AdminTableFiltersBar } from '../components/admin-table-filters-bar';
import { AdminTableSearchField } from '../components/admin-table-search-field';
import { AdminTableSelectFilter } from '../components/admin-table-select-filter';

export type AdminOrderFilterDraft = {
  q: string;
  status: string;
  orderType: string;
};

export type AdminOrdersFiltersProps = {
  draft: AdminOrderFilterDraft;
  disabled?: boolean;
  onDraftChange: (patch: Partial<AdminOrderFilterDraft>) => void;
};

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Canceled' },
] as const;

const ORDER_TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'one_time', label: 'One-time' },
  { value: 'subscription', label: 'Subscription' },
] as const;

export function AdminOrdersFilters({
  draft,
  disabled = false,
  onDraftChange,
}: AdminOrdersFiltersProps) {
  return (
    <AdminTableFiltersBar testId="admin-orders-filters">
      <AdminTableSearchField
        label="Search"
        value={draft.q}
        placeholder="Search orders…"
        disabled={disabled}
        ariaLabel="Filter orders by game or buyer"
        onChange={(value) => onDraftChange({ q: value })}
      />
      <AdminTableSelectFilter
        label="Status"
        value={draft.status}
        options={[...STATUS_OPTIONS]}
        disabled={disabled}
        ariaLabel="Filter orders by status"
        onChange={(value) => onDraftChange({ status: value })}
      />
      <AdminTableSelectFilter
        label="Type"
        value={draft.orderType}
        options={[...ORDER_TYPE_OPTIONS]}
        disabled={disabled}
        ariaLabel="Filter orders by type"
        onChange={(value) => onDraftChange({ orderType: value })}
      />
    </AdminTableFiltersBar>
  );
}
