import type { ReactNode } from 'react';
import styles from './admin-components.module.css';

export type AdminPageShellProps = {
  children: ReactNode;
};

export function AdminPageShell({ children }: AdminPageShellProps) {
  return <div className={styles.shell}>{children}</div>;
}
