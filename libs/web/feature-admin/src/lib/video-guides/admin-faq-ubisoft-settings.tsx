'use client';

import { useEffect, useState } from 'react';
import { Button, Card, Heading, Input, Text } from '@gamestore/shared/ui';
import {
  apiErrorMessage,
  getAdminFaqUbisoftSettings,
  updateAdminFaqUbisoftSettings,
  type FaqUbisoftSettings,
} from '@gamestore/web/data-access';
import { AdminAsyncView } from '../components/admin-async-view';
import { useAdminMutation } from '../hooks/use-admin-mutation';
import { useAdminResourceState } from '../hooks/use-admin-resource';
import { AdminVideoPreview } from './admin-video-preview';
import styles from './video-guides.module.css';

function parseSetting(data: unknown): FaqUbisoftSettings {
  return data as FaqUbisoftSettings;
}

const EMPTY_FORM = {
  method1VideoUrl: '',
  method2VideoUrl: '',
  lockerDownloadUrl: '',
  lockerGithubUrl: '',
};

export function AdminFaqUbisoftSettings() {
  const { state, refetch, isRefetching } = useAdminResourceState(
    () => getAdminFaqUbisoftSettings(),
    parseSetting,
  );
  const { status, error, mutate } = useAdminMutation<FaqUbisoftSettings>();
  const [form, setForm] = useState(EMPTY_FORM);

  const saved =
    state.status === 'success'
      ? {
          method1VideoUrl: state.data.method1VideoUrl ?? '',
          method2VideoUrl: state.data.method2VideoUrl ?? '',
          lockerDownloadUrl: state.data.lockerDownloadUrl ?? '',
          lockerGithubUrl: state.data.lockerGithubUrl ?? '',
        }
      : EMPTY_FORM;

  useEffect(() => {
    if (state.status === 'success') {
      setForm(saved);
    }
  }, [state]);

  const saving = status === 'pending';

  async function handleSave() {
    const result = await mutate(() =>
      updateAdminFaqUbisoftSettings({
        method1VideoUrl: form.method1VideoUrl.trim() || null,
        method2VideoUrl: form.method2VideoUrl.trim() || null,
        lockerDownloadUrl: form.lockerDownloadUrl.trim() || null,
        lockerGithubUrl: form.lockerGithubUrl.trim() || null,
      }),
    );
    if (result) {
      refetch();
    }
  }

  async function handleClear() {
    setForm(EMPTY_FORM);
    const result = await mutate(() =>
      updateAdminFaqUbisoftSettings({
        method1VideoUrl: null,
        method2VideoUrl: null,
        lockerDownloadUrl: null,
        lockerGithubUrl: null,
      }),
    );
    if (result) {
      refetch();
    }
  }

  return (
    <Card
      className={styles.settingsCard}
      data-testid="admin-faq-ubisoft-settings"
    >
      <Heading level="h3" style={{ marginBottom: '0.5rem' }}>
        FAQ Ubisoft offline guides
      </Heading>
      <Text tone="muted">
        Configure download links and YouTube guides shown on the public FAQ page.
      </Text>

      {state.status !== 'success' ? (
        <AdminAsyncView
          state={state}
          emptyMessage="No FAQ Ubisoft settings configured."
          onRetry={refetch}
          isRetrying={isRefetching}
        >
          {() => null}
        </AdminAsyncView>
      ) : null}

      {state.status === 'success' ? (
        <div className={styles.settingsForm}>
          <div className={styles.settingsField}>
            <Text tone="muted">Method 1 video (YouTube)</Text>
            <Input
              value={form.method1VideoUrl}
              disabled={saving}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  method1VideoUrl: event.target.value,
                }))
              }
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>

          <div className={styles.settingsField}>
            <Text tone="muted">Method 2 video (YouTube)</Text>
            <Input
              value={form.method2VideoUrl}
              disabled={saving}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  method2VideoUrl: event.target.value,
                }))
              }
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>

          <div className={styles.settingsField}>
            <Text tone="muted">Ubisoft Offline Locker download URL</Text>
            <Input
              value={form.lockerDownloadUrl}
              disabled={saving}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  lockerDownloadUrl: event.target.value,
                }))
              }
              placeholder="https://..."
            />
          </div>

          <div className={styles.settingsField}>
            <Text tone="muted">Ubisoft Offline Locker GitHub URL</Text>
            <Input
              value={form.lockerGithubUrl}
              disabled={saving}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  lockerGithubUrl: event.target.value,
                }))
              }
              placeholder="https://github.com/..."
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
              {saving ? 'Saving…' : 'Save FAQ links'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={saving}
              onClick={() => void handleClear()}
            >
              Clear all
            </Button>
          </div>

          <AdminVideoPreview
            url={form.method1VideoUrl}
            title="FAQ Ubisoft method 1 preview"
          />
          <AdminVideoPreview
            url={form.method2VideoUrl}
            title="FAQ Ubisoft method 2 preview"
          />
        </div>
      ) : null}
    </Card>
  );
}
