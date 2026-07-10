'use client';

import styles from './admin-table-filters.module.css';

export type AdminTableSelectOption = {
  value: string;
  label: string;
};

export type AdminTableSelectFilterProps = {
  label: string;
  value: string;
  options: AdminTableSelectOption[];
  disabled?: boolean;
  ariaLabel: string;
  className?: string;
  onChange: (value: string) => void;
};

export function AdminTableSelectFilter({
  label,
  value,
  options,
  disabled = false,
  ariaLabel,
  className,
  onChange,
}: AdminTableSelectFilterProps) {
  return (
    <label className={styles.filterItem}>
      <span className={styles.filterLabel}>{label}</span>
      <select
        className={className ?? styles.filterSelect}
        value={value}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value || '__all__'} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
