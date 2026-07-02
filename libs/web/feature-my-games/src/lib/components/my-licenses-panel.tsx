'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Badge,
  Button,
  Card,
  Container,
  Heading,
  Text,
} from '@gamestore/shared/ui';
import {
  ApiError,
  fetchMyLicenses,
  validateLicense,
  type UserLicenseSummary,
} from '@gamestore/web/data-access';
import {
  formatLicenseExpiry,
  formatLicenseSource,
  isLicenseExpired,
} from '@gamestore/web/feature-subscriptions';
import { useValidatedLicense } from './validated-license-context';
import styles from './section.module.css';

export function MyLicensesPanel() {
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

  if (loading) {
    return (
      <section className={styles.sectionTight}>
        <Container>
          <Text tone="muted">Loading your licenses…</Text>
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
            const expired = isLicenseExpired(license.expiresAt);

            return (
              <Card key={license.id} className={styles.panel}>
                <div className={styles.licenseRow}>
                  <div>
                    <Text>
                      <strong>{license.game.title}</strong>
                    </Text>
                    <Text tone="muted">
                      {license.licenseKey} — {license.status}
                    </Text>
                    <div className={styles.licenseMeta}>
                      <Badge variant={expired ? 'default' : 'success'}>
                        {formatLicenseExpiry(license.expiresAt)}
                      </Badge>
                      <Badge variant="accent">
                        {formatLicenseSource(license.source)}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    disabled={
                      expired || selectingKey === license.licenseKey
                    }
                    onClick={() => void handleSelect(license.licenseKey)}
                  >
                    {expired
                      ? 'Expired'
                      : selectingKey === license.licenseKey
                        ? 'Loading…'
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
