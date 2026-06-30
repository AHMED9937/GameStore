import type { HTMLAttributes } from 'react';
import styles from './ui.module.css';

export function Container({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={[styles.container, className].filter(Boolean).join(' ')} {...props}>
      {children}
    </div>
  );
}
