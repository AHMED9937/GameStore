'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge, Text } from '@gamestore/shared/ui';
import {
  apiErrorMessage,
  getAdminGameReadiness,
  isSetupResponse,
  type AdminGameReadiness,
} from '@gamestore/web/data-access';
import styles from './games.module.css';

export type AdminGameReadinessPanelProps = {
  gameId: string;
  published: boolean;
  onPublishedChange: (published: boolean) => void;
  disabled?: boolean;
};

export function AdminGameReadinessPanel({
  gameId,
  published,
  onPublishedChange,
  disabled = false,
}: AdminGameReadinessPanelProps) {
  const [readiness, setReadiness] = useState<AdminGameReadiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAdminGameReadiness(gameId);
      if (isSetupResponse(result)) {
        setError(result.message);
        setReadiness(null);
        return;
      }
      setReadiness(result);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    void load();
  }, [load]);

  const canPublish = readiness?.canPublish ?? false;

  return (
    <div data-testid="admin-game-readiness-panel">
      {loading ? <Text tone="dim">Checking readiness…</Text> : null}
      {error ? (
        <Text tone="muted" role="alert">
          {error}
        </Text>
      ) : null}
      {readiness ? (
        <>
          <div className={styles.readinessSummary}>
            <Badge variant={readiness.ready ? 'success' : canPublish ? 'default' : 'default'}>
              {published
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
      <button
        type="button"
        className={styles.readinessRefresh}
        disabled={disabled || loading}
        onClick={() => void load()}
      >
        Refresh readiness
      </button>
    </div>
  );
}
