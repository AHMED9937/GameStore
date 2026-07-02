'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Button, EmptyState } from '@gamestore/shared/ui';
import type { CheckoutAsyncState } from '../types/checkout-async-state';
import styles from './section.module.css';

export type CheckoutAsyncViewProps<T> = {
  state: CheckoutAsyncState<T>;
  emptyMessage?: string;
  onRetry?: () => void;
  children: (data: T) => ReactNode;
};

export function CheckoutAsyncView<T>({
  state,
  emptyMessage = 'Select a game from the shop.',
  onRetry,
  children,
}: CheckoutAsyncViewProps<T>) {
  if (state.status === 'loading') {
    return (
      <div
        className={styles.loading}
        role="status"
        aria-live="polite"
        data-testid="checkout-summary-loading"
      >
        Loading order summary…
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div
        className={`${styles.banner} ${styles.bannerError}`}
        role="alert"
        data-testid="checkout-summary-error"
      >
        <p>{state.message}</p>
        {onRetry ? (
          <Button variant="secondary" onClick={onRetry} style={{ marginTop: '0.75rem' }}>
            Retry
          </Button>
        ) : null}
      </div>
    );
  }

  if (state.status === 'idle') {
    return (
      <div data-testid="checkout-summary-idle">
        <EmptyState message={emptyMessage} />
        <Link href="/shop" className={styles.shopLink}>
          Browse games
        </Link>
      </div>
    );
  }

  return (
    <div data-testid="checkout-summary-ready">{children(state.data)}</div>
  );
}
