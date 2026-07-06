import type { HTMLAttributes } from 'react';
import styles from './ui.module.css';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export type SpinnerProps = HTMLAttributes<HTMLSpanElement> & {
  size?: SpinnerSize;
};

export function Spinner({
  size = 'md',
  className,
  ...props
}: SpinnerProps) {
  return (
    <span
      className={[
        styles.spinner,
        size === 'sm' ? styles.spinnerSm : '',
        size === 'lg' ? styles.spinnerLg : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="status"
      aria-label="Loading"
      {...props}
    />
  );
}
