'use client';

import type { ReactNode } from 'react';
import { AdminTable, type AdminTableColumn } from './admin-table';
import styles from './admin-components.module.css';

export type AdminSelectableTableProps = {
  columns: AdminTableColumn[];
  children: ReactNode;
  caption?: string;
  selectedCount: number;
  allVisibleSelected: boolean;
  someVisibleSelected: boolean;
  onToggleAllVisible: () => void;
  selectionDisabled?: boolean;
};

export function AdminSelectableTable({
  columns,
  children,
  caption,
  selectedCount,
  allVisibleSelected,
  someVisibleSelected,
  onToggleAllVisible,
  selectionDisabled = false,
}: AdminSelectableTableProps) {
  return (
    <AdminTable
      columns={[
        {
          key: '__select',
          header: (
            <input
              type="checkbox"
              aria-label="Select all visible rows"
              checked={allVisibleSelected}
              ref={(input) => {
                if (input) {
                  input.indeterminate = someVisibleSelected;
                }
              }}
              disabled={selectionDisabled}
              onChange={onToggleAllVisible}
              data-testid="admin-select-all-checkbox"
            />
          ),
        },
        ...columns,
      ]}
      caption={caption}
    >
      {children}
    </AdminTable>
  );
}

export type AdminSelectableRowProps = {
  id: string;
  selected: boolean;
  disabled?: boolean;
  onToggle: (id: string) => void;
  children: ReactNode;
};

export function AdminSelectableRow({
  id,
  selected,
  disabled = false,
  onToggle,
  children,
}: AdminSelectableRowProps) {
  return (
    <tr data-testid={`admin-row-${id}`} data-selected={selected ? 'true' : 'false'}>
      <td className={styles.selectCell}>
        <input
          type="checkbox"
          aria-label={`Select row ${id}`}
          checked={selected}
          disabled={disabled}
          onChange={() => onToggle(id)}
          data-testid={`admin-row-checkbox-${id}`}
        />
      </td>
      {children}
    </tr>
  );
}
