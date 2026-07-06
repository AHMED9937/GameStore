'use client';

import { useEffect, useState } from 'react';
import { Button, Card, Heading, Input, Text } from '@gamestore/shared/ui';
import {
  apiErrorMessage,
  getDefaultActivationVideo,
  updateDefaultActivationVideo,
  type DefaultActivationVideoSetting,
} from '@gamestore/web/data-access';
import { AdminAsyncView } from '../components/admin-async-view';
import { useAdminMutation } from '../hooks/use-admin-mutation';
import { useAdminResourceState } from '../hooks/use-admin-resource';
import styles from './dashboard.module.css';

function parseSetting(data: unknown): DefaultActivationVideoSetting {
  return data as DefaultActivationVideoSetting;
}

function toEmbedPreviewUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.includes('youtube.com/embed/')) {
    return trimmed.startsWith('http') ? trimmed : `https:${trimmed}`;
  }
  const watchMatch = trimmed.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/,
  );
  if (watchMatch?.[1]) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }
  return trimmed.startsWith('http') ? trimmed : null;
}

export function AdminDashboardActivationVideo() {
  const { state, refetch, isRefetching } = useAdminResourceState(
    () => getDefaultActivationVideo(),
    parseSetting,
  );
  const { status, error, mutate } = useAdminMutation<DefaultActivationVideoSetting>();
  const [url, setUrl] = useState('');

  const savedUrl = state.status === 'success' ? state.data.url : null;

  useEffect(() => {
    if (state.status === 'success') {
      setUrl(state.data.url ?? '');
    }
  }, [state]);

  const previewUrl = toEmbedPreviewUrl(savedUrl ?? url);
  const saving = status === 'pending';

  async function handleSave() {
    const result = await mutate(() =>
      updateDefaultActivationVideo(url.trim() || null),
    );
    if (result) {
      refetch();
    }
  }

  async function handleClear() {
    setUrl('');
    const result = await mutate(() => updateDefaultActivationVideo(null));
    if (result) {
      refetch();
    }
  }

  return (
    <Card
      className={styles.activationVideoCard}
      data-testid="admin-dashboard-activation-video"
    >
      <Heading level="h3" style={{ marginBottom: '0.5rem' }}>
        Default activation video
      </Heading>
      <Text tone="muted">
        Used for all games without their own activation video. Per-game media
        overrides this default.
      </Text>

      {state.status !== 'success' ? (
        <AdminAsyncView
          state={state}
          emptyMessage="No default activation video configured."
          onRetry={refetch}
          isRetrying={isRefetching}
        >
          {() => null}
        </AdminAsyncView>
      ) : null}

      {state.status === 'success' ? (
        <div className={styles.activationVideoForm}>
          <div className={styles.activationVideoField}>
            <Text tone="muted">YouTube URL</Text>
            <Input
              value={url}
              disabled={saving}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://www.youtube.com/embed/..."
            />
          </div>

          {error ? (
            <Text tone="muted" role="alert">
              {apiErrorMessage(error)}
            </Text>
          ) : null}

          <div className={styles.activationVideoActions}>
            <Button
              type="button"
              variant="secondary"
              disabled={saving}
              onClick={() => void handleSave()}
            >
              {saving ? 'Saving…' : 'Save default'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={saving || !savedUrl}
              onClick={() => void handleClear()}
            >
              Clear default
            </Button>
          </div>

          {previewUrl ? (
            <div className={styles.activationVideoPreview}>
              <iframe
                src={previewUrl}
                title="Default activation video preview"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
