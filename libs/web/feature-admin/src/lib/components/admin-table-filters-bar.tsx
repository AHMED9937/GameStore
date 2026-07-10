'use client';

import type { ReactNode } from 'react';
import styles from './admin-table-filters.module.css';

export type AdminTableFiltersBarProps = {
  testId: string;
  children: ReactNode;
};

export function AdminTableFiltersBar({
  testId,
  children,
}: AdminTableFiltersBarProps) {
  return (
    <div className={styles.filters} data-testid={testId}>
      {children}
    </div>
  );
}
