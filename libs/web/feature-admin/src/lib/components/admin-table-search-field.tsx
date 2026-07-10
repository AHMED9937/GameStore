'use client';

import { Input } from '@gamestore/shared/ui';
import styles from './admin-table-filters.module.css';

export type AdminTableSearchFieldProps = {
  label: string;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel: string;
  className?: string;
  onChange: (value: string) => void;
};

export function AdminTableSearchField({
  label,
  value,
  placeholder,
  disabled = false,
  ariaLabel,
  className,
  onChange,
}: AdminTableSearchFieldProps) {
  return (
    <label className={styles.filterItem}>
      <span className={styles.filterLabel}>{label}</span>
      <Input
        className={className ?? styles.filterField}
        type="search"
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
