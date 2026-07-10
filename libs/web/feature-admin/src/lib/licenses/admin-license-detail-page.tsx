'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge, Button, Container, Input, SkeletonPanel, SkeletonText, Text } from '@gamestore/shared/ui';
import {
  apiErrorMessage,
  deleteAdminLicense,
  getAdminLicense,
  isSetupResponse,
  revokeAdminLicense,
  updateAdminLicense,
  type AdminLicenseRecord,
} from '@gamestore/web/data-access';
import { AdminPageHeader } from '../components/admin-page-header';
import { AdminPageShell } from '../components/admin-page-shell';
import { AdminLicenseDeleteSection } from './admin-license-delete-section';
import {
  DEFAULT_LICENSE_VALIDITY_YEARS,
  formatLicenseExpiryLabel,
  resolveLicenseExpiresAt,
  toDatetimeLocalValue,
} from './licenses.utils';
import styles from './licenses.module.css';

export type AdminLicenseDetailPageProps = {
  licenseId: string;
};

type BuyerFormValues = {
  buyerEmail: string;
  buyerCountry: string;
  expiresAt: string;
};

function toBuyerFormValues(license: AdminLicenseRecord): BuyerFormValues {
  const resolvedExpiry = resolveLicenseExpiresAt(
    license.expiresAt,
    license.validFrom,
  );
  return {
    buyerEmail: license.buyerEmail ?? '',
    buyerCountry: license.buyerCountry ?? '',
    expiresAt: toDatetimeLocalValue(resolvedExpiry),
  };
}

function formatValidityLabel(
  expiresAt: string | null,
  validFrom: string,
): string {
  return formatLicenseExpiryLabel(expiresAt, validFrom);
}

function statusVariant(
  status: string,
): 'default' | 'accent' | 'success' {
  if (status === 'available' || status === 'activated') {
    return 'success';
  }
  if (status === 'revoked') {
    return 'accent';
  }
  return 'default';
}

export function AdminLicenseDetailPage({ licenseId }: AdminLicenseDetailPageProps) {
  const router = useRouter();
  const [license, setLicense] = useState<AdminLicenseRecord | null>(null);
  const [values, setValues] = useState<BuyerFormValues>({
    buyerEmail: '',
    buyerCountry: '',
    expiresAt: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAdminLicense(licenseId);
      if (isSetupResponse(result)) {
        setError(result.message);
        setLicense(null);
        return;
      }
      setLicense(result);
      setValues(toBuyerFormValues(result));
    } catch (loadError: unknown) {
      setError(apiErrorMessage(loadError));
      setLicense(null);
    } finally {
      setLoading(false);
    }
  }, [licenseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCopy = useCallback(async () => {
    if (!license) {
      return;
    }
    try {
      await navigator.clipboard.writeText(license.licenseKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [license]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!license || license.status !== 'available') {
        return;
      }

      setSaving(true);
      setError(null);

      try {
        const result = await updateAdminLicense(license.id, {
          buyerEmail: values.buyerEmail.trim() || undefined,
          buyerCountry: values.buyerCountry.trim() || undefined,
          expiresAt: values.expiresAt.trim()
            ? new Date(values.expiresAt).toISOString()
            : resolveLicenseExpiresAt(null, license.validFrom).toISOString(),
        });
        if (isSetupResponse(result)) {
          setError(result.message);
          return;
        }

        setLicense(result);
        setValues(toBuyerFormValues(result));
      } catch (submitError: unknown) {
        setError(apiErrorMessage(submitError));
      } finally {
        setSaving(false);
      }
    },
    [license, values],
  );

  const handleRevoke = useCallback(async () => {
    if (!license || license.status === 'revoked') {
      return;
    }
    if (!window.confirm('Revoke this license? Buyers will no longer be able to use it.')) {
      return;
    }

    setRevoking(true);
    setError(null);
    try {
      const result = await revokeAdminLicense(license.id);
      if (isSetupResponse(result)) {
        setError(result.message);
        return;
      }
      setLicense(result);
      setValues(toBuyerFormValues(result));
    } catch (actionError: unknown) {
      setError(apiErrorMessage(actionError));
    } finally {
      setRevoking(false);
    }
  }, [license]);

  const handleDelete = useCallback(async () => {
    if (!license) {
      return;
    }
    if (
      !window.confirm(
        'Delete this license permanently? This cannot be undone.',
      )
    ) {
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      const result = await deleteAdminLicense(license.id);
      if (isSetupResponse(result)) {
        setError(result.message);
        return;
      }
      router.push('/admin/licenses');
    } catch (deleteError: unknown) {
      setError(apiErrorMessage(deleteError));
    } finally {
      setDeleting(false);
    }
  }, [license, router]);

  if (loading) {
    return (
      <Container>
        <AdminPageShell>
          <SkeletonText width="24%" />
          <SkeletonPanel height={120} style={{ marginTop: '0.75rem' }} />
        </AdminPageShell>
      </Container>
    );
  }

  if (!license) {
    return (
      <Container>
        <AdminPageShell>
          <AdminPageHeader title="License not found" />
          {error ? (
            <Text tone="muted" role="alert">
              {error}
            </Text>
          ) : null}
          <Button type="button" variant="secondary" onClick={() => router.push('/admin/licenses')}>
            Back to licenses
          </Button>
        </AdminPageShell>
      </Container>
    );
  }

  const canEdit = license.status === 'available';

  return (
    <Container>
      <AdminPageShell>
        <AdminPageHeader
          title="License details"
          description="View the full key, buyer metadata, and revoke when needed."
        />
        <div className={styles.statusRow} data-testid="admin-license-detail-status">
          <Badge variant={statusVariant(license.status)}>{license.status}</Badge>
          <Badge variant="default">{license.source}</Badge>
          <Text tone="muted">{license.gameTitle}</Text>
          <Link href={`/admin/games/${license.gameId}/edit`}>
            <Text tone="muted">Open game edit</Text>
          </Link>
        </div>
        <div className={styles.keyRow} data-testid="admin-license-detail-key">
          <code>{license.licenseKey}</code>
          <Button type="button" variant="secondary" onClick={() => void handleCopy()}>
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
        <div className={styles.metaGrid}>
          <Text tone="muted">Created {new Date(license.createdAt).toLocaleString()}</Text>
          <Text tone="muted">
            Valid from {new Date(license.validFrom).toLocaleString()}
          </Text>
          <Text tone="muted">
            Expires {formatValidityLabel(license.expiresAt, license.validFrom)}
          </Text>
          {license.subscriptionId ? (
            <Text tone="muted">Subscription {license.subscriptionId}</Text>
          ) : null}
          {license.activatedAt ? (
            <Text tone="muted">
              Activated {new Date(license.activatedAt).toLocaleString()}
            </Text>
          ) : null}
          {license.ownerEmail ? (
            <Text tone="muted">Owner {license.ownerEmail}</Text>
          ) : null}
        </div>
        {canEdit ? (
          <form onSubmit={(event) => void handleSubmit(event)}>
            <div className={styles.form}>
              <div className={styles.formField}>
                <Text tone="muted">Buyer email</Text>
                <Input
                  name="buyerEmail"
                  type="email"
                  value={values.buyerEmail}
                  disabled={saving || revoking || deleting}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      buyerEmail: event.target.value,
                    }))
                  }
                />
              </div>
              <div className={styles.formField}>
                <Text tone="muted">Buyer country (2-letter)</Text>
                <Input
                  name="buyerCountry"
                  value={values.buyerCountry}
                  maxLength={2}
                  disabled={saving || revoking || deleting}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      buyerCountry: event.target.value.toUpperCase(),
                    }))
                  }
                />
              </div>
              <div className={styles.formField}>
                <Text tone="muted">
                  Expires at (defaults to {DEFAULT_LICENSE_VALIDITY_YEARS} years)
                </Text>
                <Input
                  name="expiresAt"
                  type="datetime-local"
                  value={values.expiresAt}
                  disabled={saving || revoking || deleting}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      expiresAt: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
            {error ? (
              <div
                className={styles.formMessage}
                role="alert"
                data-testid="admin-license-detail-error"
              >
                <Text tone="muted">{error}</Text>
              </div>
            ) : null}
            <div className={styles.formActions}>
              <Button type="submit" disabled={saving || revoking || deleting}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </form>
        ) : (
          <div className={styles.metaGrid}>
            {license.buyerEmail ? (
              <Text tone="muted">Buyer email {license.buyerEmail}</Text>
            ) : null}
            {license.buyerCountry ? (
              <Text tone="muted">Buyer country {license.buyerCountry}</Text>
            ) : null}
            {error ? (
              <Text tone="muted" role="alert" data-testid="admin-license-detail-error">
                {error}
              </Text>
            ) : null}
          </div>
        )}
        <div className={styles.secondaryActions}>
          <Button
            type="button"
            variant="secondary"
            disabled={license.status === 'revoked' || saving || revoking || deleting}
            onClick={() => void handleRevoke()}
          >
            {revoking ? 'Saving…' : 'Revoke'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={deleting}
            onClick={() => router.push('/admin/licenses')}
          >
            Back to licenses
          </Button>
        </div>
        <AdminLicenseDeleteSection
          disabled={license.status === 'activated' || saving || revoking}
          deleting={deleting}
          onDelete={() => void handleDelete()}
        />
      </AdminPageShell>
    </Container>
  );
}
