'use client';

import { useState } from 'react';
import { Button, Input, Text } from '@gamestore/shared/ui';
import {
  apiErrorMessage,
  createAdminGameMedia,
  deleteAdminGameMedia,
  getAdminGameMedia,
  isSetupResponse,
  type AdminGameMediaRecord,
} from '@gamestore/web/data-access';
import { AdminAsyncView } from '../components/admin-async-view';
import { useAdminResourceState } from '../hooks/use-admin-resource';
import styles from './games.module.css';

const MEDIA_TYPES = ['video', 'screenshot', 'activation'] as const;

export type AdminGameMediaSectionProps = {
  gameId: string;
  disabled?: boolean;
};

function parseMediaList(data: unknown): AdminGameMediaRecord[] {
  return Array.isArray(data) ? (data as AdminGameMediaRecord[]) : [];
}

export function AdminGameMediaSection({
  gameId,
  disabled = false,
}: AdminGameMediaSectionProps) {
  const { state, refetch, isRefetching } = useAdminResourceState(
    () => getAdminGameMedia(gameId),
    parseMediaList,
    { deps: [gameId] },
  );
  const [type, setType] = useState<(typeof MEDIA_TYPES)[number]>('video');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const items = state.status === 'success' ? state.data : [];

  async function handleAdd() {
    if (!url.trim()) {
      setMutationError('URL is required');
      return;
    }
    setSaving(true);
    setMutationError(null);
    try {
      const result = await createAdminGameMedia(gameId, {
        type,
        url: url.trim(),
        title: title.trim() || undefined,
      });
      if (isSetupResponse(result)) {
        setMutationError(result.message);
        return;
      }
      setUrl('');
      setTitle('');
      refetch();
    } catch (err) {
      setMutationError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(mediaId: string) {
    if (!window.confirm('Remove this media item?')) {
      return;
    }
    setMutationError(null);
    try {
      await deleteAdminGameMedia(gameId, mediaId);
      refetch();
    } catch (err) {
      setMutationError(apiErrorMessage(err));
    }
  }

  const videoCount = items.filter((i) => i.type === 'video').length;
  const activationCount = items.filter((i) => i.type === 'activation').length;
  const screenshotCount = items.filter((i) => i.type === 'screenshot').length;

  return (
    <div data-testid="admin-game-media-section">
      <Text tone="muted">
        Videos: {videoCount} · Activation: {activationCount} · Screenshots:{' '}
        {screenshotCount}
      </Text>
      {activationCount === 0 ? (
        <Text tone="muted">
          No per-game activation video. The store default from the dashboard is
          used on the storefront when configured.
        </Text>
      ) : null}
      {state.status !== 'success' ? (
        <AdminAsyncView
          state={state}
          emptyMessage="No media yet."
          onRetry={refetch}
          isRetrying={isRefetching}
        >
          {() => null}
        </AdminAsyncView>
      ) : null}
      {mutationError ? (
        <Text tone="muted" role="alert">
          {mutationError}
        </Text>
      ) : null}
      {state.status === 'success' ? (
        <>
          <ul className={styles.mediaList}>
            {items.map((item) => (
              <li key={item.id} className={styles.mediaRow}>
                <div>
                  <strong>{item.type}</strong> {item.title || item.url}
                  <div className={styles.mediaUrl}>{item.url}</div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={disabled}
                  onClick={() => void handleDelete(item.id)}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
          <div className={styles.mediaForm}>
            <div className={styles.formField}>
              <Text tone="muted">Type</Text>
              <select
                className={styles.select}
                value={type}
                disabled={disabled || saving}
                onChange={(event) =>
                  setType(event.target.value as (typeof MEDIA_TYPES)[number])
                }
              >
                {MEDIA_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.formField}>
              <Text tone="muted">URL</Text>
              <Input
                value={url}
                disabled={disabled || saving}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://www.youtube.com/embed/..."
              />
            </div>
            <div className={styles.formField}>
              <Text tone="muted">Title (optional)</Text>
              <Input
                value={title}
                disabled={disabled || saving}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              disabled={disabled || saving}
              onClick={() => void handleAdd()}
            >
              {saving ? 'Adding…' : 'Add media'}
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
