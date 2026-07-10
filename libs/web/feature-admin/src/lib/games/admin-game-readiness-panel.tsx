'use client';

import { Badge, Text } from '@gamestore/shared/ui';
import {
  getAdminGameReadiness,
  type AdminGameReadiness,
} from '@gamestore/web/data-access';
import { AdminAsyncView } from '../components/admin-async-view';
import { useAdminResourceState } from '../hooks/use-admin-resource';
import styles from './games.module.css';

export type AdminGameReadinessPanelProps = {
  gameId: string;
  published: boolean;
  soldOutManual: boolean;
  hasActivePool: boolean;
  onPublishedChange: (published: boolean) => void;
  onSoldOutManualChange: (soldOutManual: boolean) => void;
  disabled?: boolean;
  refreshKey?: number;
};

function parseReadiness(data: unknown): AdminGameReadiness {
  return data as AdminGameReadiness;
}

export function AdminGameReadinessPanel({
  gameId,
  published,
  soldOutManual,
  hasActivePool,
  onPublishedChange,
  onSoldOutManualChange,
  disabled = false,
  refreshKey = 0,
}: AdminGameReadinessPanelProps) {
  const { state, refetch, isRefetching } = useAdminResourceState(
    () => getAdminGameReadiness(gameId),
    parseReadiness,
    { deps: [gameId, refreshKey] },
  );

  const readiness = state.status === 'success' ? state.data : null;
  const canPublish = readiness?.canPublish ?? false;
  const autoSoldOut = published && !hasActivePool;
  const effectiveSoldOut = soldOutManual || autoSoldOut;

  return (
    <div data-testid="admin-game-readiness-panel">
      {state.status !== 'success' ? (
        <AdminAsyncView state={state} onRetry={refetch} isRetrying={isRefetching}>
          {() => null}
        </AdminAsyncView>
      ) : null}
      {readiness ? (
        <>
          <div className={styles.readinessSummary}>
            <Badge variant={readiness.ready ? 'success' : canPublish ? 'default' : 'default'}>
              {published && effectiveSoldOut
                ? 'Sold out'
                : published
                  ? 'Published'
                  : readiness.ready
                    ? 'Ready'
                    : canPublish
                      ? 'Almost ready'
                      : 'Draft'}
            </Badge>
            <Text tone="muted">
              {canPublish
                ? 'All required checks passed.'
                : 'Complete required items before publishing.'}
            </Text>
          </div>
          <ul className={styles.readinessList}>
            {readiness.checks.map((check) => (
              <li key={check.id} className={styles.readinessItem}>
                <span
                  className={
                    check.passed ? styles.readinessPass : styles.readinessFail
                  }
                >
                  {check.passed ? '✓' : '✗'}
                </span>
                <span>
                  {check.label}
                  {!check.required ? ' (recommended)' : ''}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      <label className={styles.publishToggle}>
        <input
          type="checkbox"
          checked={published}
          disabled={disabled || (!published && !canPublish)}
          onChange={(event) => onPublishedChange(event.target.checked)}
        />
        <Text>Published (visible in shop)</Text>
      </label>
      {!canPublish && !published ? (
        <Text tone="dim">
          Publishing is blocked until all required checks pass. Save other tabs
          first, then refresh readiness.
        </Text>
      ) : null}
      <label className={styles.publishToggle}>
        <input
          type="checkbox"
          checked={soldOutManual || autoSoldOut}
          disabled={disabled || !published || autoSoldOut}
          onChange={(event) => onSoldOutManualChange(event.target.checked)}
        />
        <Text>Sold out (visible in shop, not purchasable)</Text>
      </label>
      {autoSoldOut ? (
        <Text tone="dim">
          No active pool account is linked. Add an active pool account to sell
          again.
        </Text>
      ) : null}
      <button
        type="button"
        className={styles.readinessRefresh}
        disabled={disabled || isRefetching}
        onClick={() => refetch()}
      >
        {isRefetching ? 'Refreshing…' : 'Refresh readiness'}
      </button>
    </div>
  );
}
