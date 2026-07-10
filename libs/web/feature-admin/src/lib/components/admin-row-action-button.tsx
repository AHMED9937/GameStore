import type { ReactNode } from 'react';
import type { ButtonProps } from '@gamestore/shared/ui';
import { Button } from '@gamestore/shared/ui';
import styles from './admin-row-action-button.module.css';

export type AdminRowActionButtonProps = Omit<ButtonProps, 'children'> & {
  label: string;
  icon: ReactNode;
};

export function AdminRowActionButton({
  label,
  icon,
  className,
  variant = 'secondary',
  ...props
}: AdminRowActionButtonProps) {
  return (
    <Button
      type="button"
      variant={variant}
      className={[styles.iconButton, className].filter(Boolean).join(' ')}
      aria-label={label}
      title={label}
      {...props}
    >
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
    </Button>
  );
}
