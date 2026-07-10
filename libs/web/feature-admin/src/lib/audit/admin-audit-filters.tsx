'use client';

import { AdminTableFiltersBar } from '../components/admin-table-filters-bar';
import { AdminTableSearchField } from '../components/admin-table-search-field';

export type AdminAuditFilterDraft = {
  q: string;
};

export type AdminAuditFiltersProps = {
  draft: AdminAuditFilterDraft;
  disabled?: boolean;
  onDraftChange: (patch: Partial<AdminAuditFilterDraft>) => void;
};

export function AdminAuditFilters({
  draft,
  disabled = false,
  onDraftChange,
}: AdminAuditFiltersProps) {
  return (
    <AdminTableFiltersBar testId="admin-audit-filters">
      <AdminTableSearchField
        label="Search"
        value={draft.q}
        placeholder="Filter by action, resource, or actor…"
        disabled={disabled}
        ariaLabel="Filter audit log by action, resource, or actor"
        onChange={(value) => onDraftChange({ q: value })}
      />
    </AdminTableFiltersBar>
  );
}
