'use client';

import { SkeletonBanner } from '@gamestore/shared/ui';
import styles from './admin-components.module.css';

export type AdminActionFeedbackProps = {
  error?: string | null;
  message?: string | null;
  isPending?: boolean;
  pendingMessage?: string;
  testIdPrefix?: string;
};

export function AdminActionFeedback({
  error,
  message,
  isPending = false,
  pendingMessage = 'Applying changes…',
  testIdPrefix = 'admin-action',
}: AdminActionFeedbackProps) {
  const normalizedError = error?.trim();
  const normalizedMessage = message?.trim();

  return (
    <>
      {normalizedError ? (
        <div
          className={`${styles.banner} ${styles.bannerError}`}
          role="alert"
          data-testid={`${testIdPrefix}-error`}
        >
          {normalizedError}
        </div>
      ) : null}
      {isPending ? (
        <div
          className={`${styles.banner} ${styles.bannerSetup}`}
          role="status"
          data-testid={`${testIdPrefix}-pending`}
        >
          <SkeletonBanner aria-hidden="true" />
        </div>
      ) : normalizedMessage ? (
        <div
          className={`${styles.banner} ${styles.bannerSetup}`}
          role="status"
          data-testid={`${testIdPrefix}-message`}
        >
          {normalizedMessage}
        </div>
      ) : null}
    </>
  );
}
