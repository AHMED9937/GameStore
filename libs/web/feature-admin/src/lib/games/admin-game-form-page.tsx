'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Text } from '@gamestore/shared/ui';
import {
  apiErrorMessage,
  createAdminGame,
  isSetupResponse,
} from '@gamestore/web/data-access';
import { AdminAsyncView } from '../components/admin-async-view';
import { AdminPageHeader } from '../components/admin-page-header';
import { AdminPageShell } from '../components/admin-page-shell';
import type { AdminAsyncState } from '../types/admin-async-state';
import { AdminGameForm } from './admin-game-form';
import { AdminGameFormActions } from './admin-game-form-actions';
import {
  EMPTY_ADMIN_GAME_FORM_VALUES,
  toAdminGameInput,
  type AdminGameFormValues,
  type AdminGameTab,
} from './admin-games.types';
import styles from './games.module.css';

export type AdminGameFormPageProps = {
  formState?: AdminAsyncState<AdminGameFormValues>;
};

export function AdminGameFormPage({ formState }: AdminGameFormPageProps) {
  const router = useRouter();
  const [values, setValues] = useState<AdminGameFormValues>(EMPTY_ADMIN_GAME_FORM_VALUES);
  const [activeTab, setActiveTab] = useState<AdminGameTab>('basics');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isControlled = formState !== undefined;
  const controlledValues =
    formState?.status === 'success' ? formState.data : EMPTY_ADMIN_GAME_FORM_VALUES;

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isControlled) {
        return;
      }

      setSaving(true);
      setError(null);

      try {
        const result = await createAdminGame(toAdminGameInput(values));

        if (isSetupResponse(result)) {
          setError(result.message);
          return;
        }

        router.push(`/admin/games/${result.id}/edit`);
      } catch (submitError: unknown) {
        setError(apiErrorMessage(submitError));
      } finally {
        setSaving(false);
      }
    },
    [isControlled, router, values],
  );

  if (isControlled) {
    return (
      <Container>
        <AdminPageShell>
          <AdminPageHeader
            title="New game"
            description="Add a catalog title manually or import metadata from IGDB."
          />
          {formState.status !== 'success' ? (
            <AdminAsyncView state={formState}>{() => null}</AdminAsyncView>
          ) : null}
          <AdminGameForm
            mode="create"
            values={controlledValues}
            disabled={formState.status !== 'success'}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            publishSection={
              <Text tone="dim">
                Save the game first, then use the Publish tab on the edit page.
              </Text>
            }
            marketingSection={
              <Text tone="dim">
                Save the game first, then use the Marketing tab on the edit page.
              </Text>
            }
          />
          <AdminGameFormActions />
        </AdminPageShell>
      </Container>
    );
  }

  return (
    <Container>
      <AdminPageShell>
        <AdminPageHeader
          title="New game"
          description={
            <Text tone="muted">
              Add a catalog title manually or{' '}
              <Link href="/admin/igdb">import metadata from IGDB</Link>.
            </Text>
          }
        />
        <form onSubmit={(event) => void handleSubmit(event)}>
          <AdminGameForm
            mode="create"
            values={values}
            disabled={saving}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onValuesChange={setValues}
            publishSection={
              <Text tone="dim">
                Save the game first, then use the Publish tab on the edit page.
              </Text>
            }
            marketingSection={
              <Text tone="dim">
                Save the game first, then use the Marketing tab on the edit page.
              </Text>
            }
          />
          {error ? (
            <div className={styles.formMessage} role="alert" data-testid="admin-game-form-error">
              <Text tone="muted">{error}</Text>
            </div>
          ) : null}
          <AdminGameFormActions saving={saving} submitLabel="Create game" />
        </form>
      </AdminPageShell>
    </Container>
  );
}
