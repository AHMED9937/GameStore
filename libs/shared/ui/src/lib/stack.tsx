import type { HTMLAttributes } from 'react';
import styles from './ui.module.css';

export type StackProps = HTMLAttributes<HTMLDivElement> & {
  direction?: 'row' | 'column';
  gap?: 'sm' | 'md' | 'lg';
};

const gapClass = {
  sm: styles.gapSm,
  md: styles.gapMd,
  lg: styles.gapLg,
};

export function Stack({
  direction = 'column',
  gap = 'md',
  className,
  children,
  ...props
}: StackProps) {
  return (
    <div
      className={[
        direction === 'row' ? styles.stackRow : styles.stack,
        gapClass[gap],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}
