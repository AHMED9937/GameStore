import type { ReactNode } from 'react';
import { EmptyState } from '@gamestore/shared/ui';
import type { AdminAsyncState } from '../types/admin-async-state';
import styles from './admin-components.module.css';

export type AdminAsyncViewProps<T> = {
  state: AdminAsyncState<T>;
  emptyMessage?: string;
  children: (data: T) => ReactNode;
};

export function AdminAsyncView<T>({
  state,
  emptyMessage = 'No records yet.',
  children,
}: AdminAsyncViewProps<T>) {
  if (state.status === 'idle' || state.status === 'loading') {
    return (
      <div className={styles.loading} role="status" aria-live="polite">
        Loading…
      </div>
    );
  }

  if (state.status === 'setup') {
    return (
      <div
        className={`${styles.banner} ${styles.bannerSetup}`}
        role="status"
        data-testid="admin-setup-banner"
      >
        {state.message}
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div
        className={`${styles.banner} ${styles.bannerError}`}
        role="alert"
        data-testid="admin-error-banner"
      >
        {state.message}
      </div>
    );
  }

  if (state.status === 'empty') {
    return <EmptyState message={emptyMessage} />;
  }

  return <>{children(state.data)}</>;
}
