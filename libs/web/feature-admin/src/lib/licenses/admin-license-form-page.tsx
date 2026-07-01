'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Text, Button } from '@gamestore/shared/ui';
import {
  apiErrorMessage,
  createAdminLicense,
  generateAdminLicenseKey,
  isSetupResponse,
  type AdminLicenseRecord,
} from '@gamestore/web/data-access';
import { AdminAsyncView } from '../components/admin-async-view';
import { AdminPageHeader } from '../components/admin-page-header';
import { AdminPageShell } from '../components/admin-page-shell';
import type { AdminAsyncState } from '../types/admin-async-state';
import { AdminLicenseForm } from './admin-license-form';
import { AdminLicenseFormActions } from './admin-license-form-actions';
import {
  EMPTY_ADMIN_LICENSE_FORM_VALUES,
  type AdminLicenseFormValues,
} from './admin-licenses.types';
import styles from './licenses.module.css';

export type AdminLicenseFormPageProps = {
  formState?: AdminAsyncState<AdminLicenseFormValues>;
};

function extractLicenseKeys(
  result: AdminLicenseRecord | { licenses: AdminLicenseRecord[] },
): string[] {
  if ('licenses' in result) {
    return result.licenses.map((license) => license.licenseKey);
  }
  return [result.licenseKey];
}

export function AdminLicenseFormPage({ formState }: AdminLicenseFormPageProps) {
  const router = useRouter();
  const isControlled = formState !== undefined;
  const [values, setValues] = useState<AdminLicenseFormValues>(
    EMPTY_ADMIN_LICENSE_FORM_VALUES,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issuedKeys, setIssuedKeys] = useState<string[]>([]);
  const controlledValues =
    formState?.status === 'success' ? formState.data : EMPTY_ADMIN_LICENSE_FORM_VALUES;

  const issueLicenses = useCallback(
    async (mode: 'create' | 'generate') => {
      if (isControlled) {
        return;
      }
      if (!values.gameId) {
        setError('Select a game first.');
        return;
      }

      setSaving(true);
      setError(null);
      setIssuedKeys([]);

      try {
        const payload = {
          gameId: values.gameId,
          buyerEmail: values.buyerEmail.trim() || undefined,
          ...(mode === 'create'
            ? { quantity: Number.parseInt(values.quantity, 10) || 1 }
            : {}),
        };

        const result =
          mode === 'generate'
            ? await generateAdminLicenseKey(payload)
            : await createAdminLicense(payload);

        if (isSetupResponse(result)) {
          setError(result.message);
          return;
        }

        setIssuedKeys(extractLicenseKeys(result));
      } catch (submitError: unknown) {
        setError(apiErrorMessage(submitError));
      } finally {
        setSaving(false);
      }
    },
    [isControlled, values],
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      await issueLicenses('create');
    },
    [issueLicenses],
  );

  if (isControlled) {
    return (
      <Container>
        <AdminPageShell>
          <AdminPageHeader
            title="Issue license"
            description="Create activation keys for a catalog title."
          />
          {formState.status !== 'success' ? (
            <AdminAsyncView state={formState}>{() => null}</AdminAsyncView>
          ) : null}
          <AdminLicenseForm
            values={controlledValues}
            disabled={formState.status !== 'success'}
          />
          <AdminLicenseFormActions />
        </AdminPageShell>
      </Container>
    );
  }

  return (
    <Container>
      <AdminPageShell>
        <AdminPageHeader
          title="Issue license"
          description="Create activation keys for a catalog title."
        />
        <form onSubmit={(event) => void handleSubmit(event)}>
          <AdminLicenseForm
            values={values}
            disabled={saving}
            onValuesChange={setValues}
          />
          {error ? (
            <div className={styles.formMessage} role="alert" data-testid="admin-license-form-error">
              <Text tone="muted">{error}</Text>
            </div>
          ) : null}
          {issuedKeys.length > 0 ? (
            <div className={styles.keyResult} data-testid="admin-license-form-success">
              <Text>Issued {issuedKeys.length} license key(s):</Text>
              <ul>
                {issuedKeys.map((key) => (
                  <li key={key}>
                    <code>{key}</code>
                  </li>
                ))}
              </ul>
              <Button type="button" variant="secondary" onClick={() => router.push('/admin/licenses')}>
                Back to licenses
              </Button>
            </div>
          ) : (
            <AdminLicenseFormActions
              saving={saving}
              onGenerateKey={() => void issueLicenses('generate')}
            />
          )}
        </form>
      </AdminPageShell>
    </Container>
  );
}
