'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Badge,
  Button,
  Card,
  Container,
  Heading,
  SkeletonPanel,
  SkeletonText,
  Text,
} from '@gamestore/shared/ui';
import {
  ApiError,
  fetchMyLicenses,
  validateLicense,
  type UserLicenseSummary,
} from '@gamestore/web/data-access';
import {
  formatLicenseSource,
  getLicenseExpiryState,
} from '@gamestore/web/feature-subscriptions';
import { useValidatedLicense } from './validated-license-context';
import styles from './section.module.css';

export type MyLicensesPanelProps = {
  showInlineLoading?: boolean;
  onInitialLoadingChange?: (loading: boolean) => void;
};

export function MyLicensesPanel({
  showInlineLoading = true,
  onInitialLoadingChange,
}: MyLicensesPanelProps = {}) {
  const { setValidatedLicense, setStep } = useValidatedLicense();
  const [licenses, setLicenses] = useState<UserLicenseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectingKey, setSelectingKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const rows = await fetchMyLicenses();
        if (!cancelled) {
          setLicenses(rows);
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 401) {
            setError(null);
            setLicenses([]);
          } else {
            setError(
              err instanceof ApiError
                ? err.message
                : 'Could not load your licenses',
            );
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    onInitialLoadingChange?.(loading);
  }, [loading, onInitialLoadingChange]);

  async function handleSelect(licenseKey: string) {
    setSelectingKey(licenseKey);
    setError(null);
    try {
      const response = await validateLicense(licenseKey);
      setValidatedLicense({
        licenseKey: response.licenseKey,
        status: response.status,
        game: response.game,
      });
      setStep('pick-game');
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Could not load license',
      );
    } finally {
      setSelectingKey(null);
    }
  }

  if (loading && showInlineLoading) {
    return (
      <section className={styles.sectionTight}>
        <Container>
          <SkeletonText width="42%" />
          <SkeletonPanel height={120} style={{ marginTop: '0.75rem' }} />
        </Container>
      </section>
    );
  }

  if (licenses.length === 0) {
    return (
      <section className={styles.sectionTight}>
        <Container>
          <Card className={styles.panel}>
            <Text tone="muted">
              No licenses on your account yet. Buy a game or subscribe to The
              Pass to get started.
            </Text>
            <Link href="/subscriptions" className={styles.shopLink}>
              View subscription plans
            </Link>
          </Card>
        </Container>
      </section>
    );
  }

  return (
    <section className={styles.sectionTight}>
      <Container>
        <Heading level="h2">Your licenses</Heading>
        {error ? <Text tone="muted">{error}</Text> : null}
        <div className={styles.licenseList}>
          {licenses.map((license) => {
            const expiry = getLicenseExpiryState(
              license.expiresAt,
              license.validFrom,
            );
            const isActivated = license.status === 'activated';

            return (
              <Card key={license.id} className={styles.panel}>
                <div className={styles.licenseRow}>
                  <div>
                    <Text>
                      <strong>{license.game.title}</strong>
                    </Text>
                    <Text tone="muted">
                      {license.licenseKey}
                      {isActivated ? ' · Active' : ` · ${license.status}`}
                    </Text>
                    <div className={styles.licenseMeta}>
                      <Badge variant={expiry.expired ? 'default' : 'success'}>
                        {expiry.label}
                      </Badge>
                      <Badge variant="accent">
                        {formatLicenseSource(license.source)}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    disabled={
                      expiry.expired || selectingKey === license.licenseKey
                    }
                    onClick={() => void handleSelect(license.licenseKey)}
                  >
                    {expiry.expired
                      ? 'Expired'
                      : selectingKey === license.licenseKey
                        ? '…'
                        : 'Select'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
