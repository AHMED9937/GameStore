import type { HTMLAttributes } from 'react';
import { Spinner } from './spinner';
import styles from './ui.module.css';

export type LoadingStateProps = HTMLAttributes<HTMLDivElement> & {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  centered?: boolean;
};

export function LoadingState({
  label = 'Loading…',
  size = 'md',
  centered = true,
  className,
  ...props
}: LoadingStateProps) {
  return (
    <div
      className={[
        styles.loadingState,
        centered ? styles.loadingStateCentered : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="status"
      aria-live="polite"
      {...props}
    >
      <Spinner size={size} />
      {label ? <span className={styles.loadingStateLabel}>{label}</span> : null}
    </div>
  );
}
