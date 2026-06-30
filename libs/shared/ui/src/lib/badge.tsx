import type { HTMLAttributes } from 'react';
import styles from './ui.module.css';

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'accent' | 'success';
};

const variantClass: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: styles.badgeDefault,
  accent: styles.badgeAccent,
  success: styles.badgeSuccess,
};

export function Badge({
  variant = 'default',
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={[variantClass[variant], className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </span>
  );
}
