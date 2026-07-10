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

export type AdminGameFilterDraft = {
  q: string;
  platform: string;
  status: '' | 'published' | 'draft' | 'sold_out';
};

export type AdminGamesFiltersProps = {
  draft: AdminGameFilterDraft;
  disabled?: boolean;
  onDraftChange: (patch: Partial<AdminGameFilterDraft>) => void;
};

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'sold_out', label: 'Sold out' },
] as const;

const PLATFORM_OPTIONS = [
  { value: '', label: 'All platforms' },
  { value: 'steam', label: 'Steam' },
  { value: 'ubisoft', label: 'Ubisoft' },
] as const;

export function AdminGamesFilters({
  draft,
  disabled = false,
  onDraftChange,
}: AdminGamesFiltersProps) {
  return (
    <AdminTableFiltersBar testId="admin-games-filters">
      <AdminTableSearchField
        label="Search"
        value={draft.q}
        placeholder="Search games…"
        disabled={disabled}
        ariaLabel="Filter games by title or slug"
        onChange={(value) => onDraftChange({ q: value })}
      />
      <AdminTableSelectFilter
        label="Platform"
        value={draft.platform}
        options={[...PLATFORM_OPTIONS]}
        disabled={disabled}
        ariaLabel="Filter games by platform"
        onChange={(value) => onDraftChange({ platform: value })}
      />
      <AdminTableSelectFilter
        label="Status"
        value={draft.status}
        options={[...STATUS_OPTIONS]}
        disabled={disabled}
        ariaLabel="Filter games by status"
        onChange={(value) =>
          onDraftChange({
            status: value as AdminGameFilterDraft['status'],
          })
        }
      />
    </AdminTableFiltersBar>
  );
}
