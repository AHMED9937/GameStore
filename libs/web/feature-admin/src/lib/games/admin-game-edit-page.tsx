'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Text } from '@gamestore/shared/ui';
import {
  apiErrorMessage,
  deleteAdminGame,
  getAdminGame,
  isSetupResponse,
  updateAdminGame,
} from '@gamestore/web/data-access';
import { AdminAsyncView } from '../components/admin-async-view';
import { AdminPageHeader } from '../components/admin-page-header';
import { AdminPageShell } from '../components/admin-page-shell';
import type { AdminAsyncState } from '../types/admin-async-state';
import { useAdminResourceState } from '../hooks/use-admin-resource';
import { AdminGameAccountsSection } from './admin-game-accounts-section';
import { AdminGameDeleteSection } from './admin-game-delete-section';
import { AdminGameForm } from './admin-game-form';
import { AdminGameFormActions } from './admin-game-form-actions';
import { AdminGameMediaSection } from './admin-game-media-section';
import { AdminGameReadinessPanel } from './admin-game-readiness-panel';
import {
  parseAdminGameForm,
  toAdminGameInput,
  type AdminGameFormValues,
  type AdminGameTab,
} from './admin-games.types';
import styles from './games.module.css';

export type AdminGameEditPageProps = {
  gameId: string;
  formState?: AdminAsyncState<AdminGameFormValues>;
};

export function AdminGameEditPage({ gameId, formState }: AdminGameEditPageProps) {
  const router = useRouter();
  const fetchedState = useAdminResourceState(
    () => getAdminGame(gameId),
    parseAdminGameForm,
    { deps: [gameId] },
  );
  const state = formState ?? fetchedState;
  const isControlled = formState !== undefined;
  const [values, setValues] = useState<AdminGameFormValues | null>(null);
  const [activeTab, setActiveTab] = useState<AdminGameTab>('basics');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const resolvedValues =
    isControlled && state.status === 'success'
      ? state.data
      : values ?? (state.status === 'success' ? state.data : null);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!resolvedValues || isControlled) {
        return;
      }

      setSaving(true);
      setError(null);
      setSavedMessage(null);

      try {
        const result = await updateAdminGame(gameId, toAdminGameInput(resolvedValues));

        if (isSetupResponse(result)) {
          setError(result.message);
          return;
        }

        setValues(parseAdminGameForm(result));
        setSavedMessage('Game saved.');
      } catch (submitError: unknown) {
        setError(apiErrorMessage(submitError));
      } finally {
        setSaving(false);
      }
    },
    [gameId, isControlled, resolvedValues],
  );

  const handleDelete = useCallback(async () => {
    if (isControlled) {
      return;
    }

    const confirmed = window.confirm(
      'Delete this game permanently? This cannot be undone.',
    );
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const result = await deleteAdminGame(gameId);
      if (isSetupResponse(result)) {
        setError(result.message);
        return;
      }

      router.push('/admin/games');
    } catch (deleteError: unknown) {
      setError(apiErrorMessage(deleteError));
    } finally {
      setDeleting(false);
    }
  }, [gameId, isControlled, router]);

  return (
    <Container>
      <AdminPageShell>
        <AdminPageHeader
          title="Edit game"
          description={`Update catalog details for game ${gameId}.`}
        />
        {state.status !== 'success' ? (
          <AdminAsyncView state={state}>{() => null}</AdminAsyncView>
        ) : null}
        {resolvedValues ? (
          <form onSubmit={(event) => void handleSubmit(event)}>
            <AdminGameForm
              mode="edit"
              values={resolvedValues}
              disabled={saving || deleting || isControlled}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onValuesChange={isControlled ? undefined : setValues}
              mediaSection={
                <AdminGameMediaSection
                  gameId={gameId}
                  disabled={saving || deleting || isControlled}
                />
              }
              accountsSection={
                <AdminGameAccountsSection
                  gameId={gameId}
                  disabled={saving || deleting || isControlled}
                />
              }
              publishSection={
                <AdminGameReadinessPanel
                  gameId={gameId}
                  published={resolvedValues.published}
                  disabled={saving || deleting || isControlled}
                  onPublishedChange={(published) => {
                    if (isControlled) {
                      return;
                    }
                    setValues((current) =>
                      current ? { ...current, published } : { ...resolvedValues, published },
                    );
                  }}
                />
              }
            />
            {error ? (
              <div className={styles.formMessage} role="alert" data-testid="admin-game-form-error">
                <Text tone="muted">{error}</Text>
              </div>
            ) : null}
            {savedMessage ? (
              <div className={styles.formMessage} role="status" data-testid="admin-game-form-success">
                <Text>{savedMessage}</Text>
              </div>
            ) : null}
            <AdminGameFormActions
              cancelHref="/admin/games"
              saving={saving}
            />
          </form>
        ) : null}
        <AdminGameDeleteSection
          disabled={isControlled || state.status !== 'success'}
          deleting={deleting}
          onDelete={() => void handleDelete()}
        />
      </AdminPageShell>
    </Container>
  );
}
