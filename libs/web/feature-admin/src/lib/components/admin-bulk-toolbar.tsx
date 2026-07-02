'use client';

import type { ReactNode } from 'react';
import { Button, Text } from '@gamestore/shared/ui';
import styles from './admin-components.module.css';

export type AdminBulkToolbarProps = {
  selectedCount: number;
  onClear: () => void;
  children: ReactNode;
  disabled?: boolean;
};

export function AdminBulkToolbar({
  selectedCount,
  onClear,
  children,
  disabled = false,
}: AdminBulkToolbarProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className={styles.bulkToolbar} data-testid="admin-bulk-toolbar">
      <Text>
        <strong>{selectedCount}</strong> selected
      </Text>
      <div className={styles.bulkToolbarActions}>{children}</div>
      <Button
        type="button"
        variant="secondary"
        onClick={onClear}
        disabled={disabled}
      >
        Clear
      </Button>
    </div>
  );
}
