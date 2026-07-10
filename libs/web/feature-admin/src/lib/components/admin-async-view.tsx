import type { ReactNode } from 'react';
import { Button, EmptyState, SkeletonPanel } from '@gamestore/shared/ui';
import type { AdminAsyncState } from '../types/admin-async-state';
import styles from './admin-components.module.css';

export type AdminAsyncViewProps<T> = {
  state: AdminAsyncState<T>;
  emptyMessage?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  children: (data: T) => ReactNode;
};

export function AdminAsyncView<T>({
  state,
  emptyMessage = 'No records yet.',
  onRetry,
  isRetrying = false,
  children,
}: AdminAsyncViewProps<T>) {
  if (state.status === 'idle' || state.status === 'loading') {
    return (
      <SkeletonPanel
        height={56}
        className={styles.compactLoadingPanel}
        data-testid="admin-async-loading"
      />
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
        <p>{state.message}</p>
        {onRetry ? (
          <Button
            type="button"
            variant="secondary"
            disabled={isRetrying}
            onClick={onRetry}
            data-testid="admin-error-retry"
          >
            {isRetrying ? 'Retrying…' : 'Retry'}
          </Button>
        ) : null}
      </div>
    );
  }

  if (state.status === 'empty') {
    return <EmptyState message={emptyMessage} />;
  }

  return <>{children(state.data)}</>;
}
