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
import { AdminVideoPreview } from './admin-video-preview';
import styles from './video-guides.module.css';

function parseSetting(data: unknown): DefaultActivationVideoSetting {
  return data as DefaultActivationVideoSetting;
}

export function AdminActivationVideoSettings() {
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
      className={styles.settingsCard}
      data-testid="admin-activation-video-settings"
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
        <div className={styles.settingsForm}>
          <div className={styles.settingsField}>
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

          <div className={styles.settingsActions}>
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

          <AdminVideoPreview
            url={savedUrl ?? url}
            title="Default activation video preview"
          />
        </div>
      ) : null}
    </Card>
  );
}
