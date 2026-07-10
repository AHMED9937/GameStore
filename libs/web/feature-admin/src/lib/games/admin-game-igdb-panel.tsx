'use client';

import { useCallback, useState } from 'react';
import { Button, Text } from '@gamestore/shared/ui';
import {
  apiErrorMessage,
  isSetupResponse,
  syncAdminGameFromIgdb,
} from '@gamestore/web/data-access';
import styles from './games.module.css';

export type AdminGameIgdbPanelProps = {
  gameId: string;
  igdbId: number | null;
  igdbSyncedAt: string | null;
  igdbCoverUrl: string | null;
  disabled?: boolean;
  onSynced?: () => void;
};

export function AdminGameIgdbPanel({
  gameId,
  igdbId,
  igdbSyncedAt,
  igdbCoverUrl,
  disabled = false,
  onSynced,
}: AdminGameIgdbPanelProps) {
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSync = useCallback(async () => {
    if (!igdbId) {
      return;
    }

    setSyncing(true);
    setError(null);
    setMessage(null);

    try {
      const result = await syncAdminGameFromIgdb(gameId);
      if (isSetupResponse(result)) {
        setError(result.message);
        return;
      }
      setMessage('Metadata refreshed from IGDB.');
      onSynced?.();
    } catch (syncError: unknown) {
      setError(apiErrorMessage(syncError));
    } finally {
      setSyncing(false);
    }
  }, [gameId, igdbId, onSynced]);

  if (!igdbId) {
    return (
      <div className={styles.igdbPanel} data-testid="admin-game-igdb-panel">
        <Text tone="muted">No IGDB link. Import this game from the IGDB admin page.</Text>
      </div>
    );
  }

  return (
    <div className={styles.igdbPanel} data-testid="admin-game-igdb-panel">
      <Text tone="muted">IGDB ID</Text>
      <Text>{igdbId}</Text>
      <Text tone="muted">Last synced</Text>
      <Text>{igdbSyncedAt ? new Date(igdbSyncedAt).toLocaleString() : '—'}</Text>
      {igdbCoverUrl ? (
        <>
          <Text tone="muted">IGDB cover URL</Text>
          <Text className={styles.igdbCoverUrl}>{igdbCoverUrl}</Text>
        </>
      ) : null}
      {error ? (
        <div className={styles.igdbError} role="alert" data-testid="admin-game-igdb-error">
          {error}
        </div>
      ) : null}
      {message ? (
        <Text tone="muted" data-testid="admin-game-igdb-success">
          {message}
        </Text>
      ) : null}
      <Button
        type="button"
        variant="secondary"
        disabled={disabled || syncing}
        onClick={() => void handleSync()}
      >
        {syncing ? 'Syncing…' : 'Refresh from IGDB'}
      </Button>
    </div>
  );
}
