import type { HTMLAttributes } from 'react';
import { Spinner } from './spinner';
import styles from './ui.module.css';

export type LoadingStateProps = HTMLAttributes<HTMLDivElement> & {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'overlay' | 'section' | 'inline';
};

export function LoadingState({
  label = 'Loading…',
  size = 'md',
  variant = 'section',
  className,
  ...props
}: LoadingStateProps) {
  return (
    <div
      className={[
        styles.loadingState,
        variant === 'overlay' ? styles.loadingOverlay : '',
        variant === 'section' ? styles.loadingSection : '',
        variant === 'inline' ? styles.loadingInline : '',
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
