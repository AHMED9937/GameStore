'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Container,
  Heading,
  Text,
} from '@gamestore/shared/ui';
import {
  ApiError,
  fetchMyLicenses,
  type UserLicenseSummary,
} from '@gamestore/web/data-access';
import { useValidatedLicense } from './validated-license-context';
import styles from './section.module.css';

export function MyLicensesPanel() {
  const { setLicenseKey } = useValidatedLicense();
  const [licenses, setLicenses] = useState<UserLicenseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          setError(
            err instanceof ApiError ? err.message : 'Could not load your licenses',
          );
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

  if (loading) {
    return (
      <section className={styles.sectionTight}>
        <Container>
          <Text tone="muted">Loading your licenses…</Text>
        </Container>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.sectionTight}>
        <Container>
          <Text tone="muted">{error}</Text>
        </Container>
      </section>
    );
  }

  if (licenses.length === 0) {
    return (
      <section className={styles.sectionTight}>
        <Container>
          <Text tone="dim">
            No licenses linked to your account yet. Keys from checkout will appear
            here after purchase.
          </Text>
        </Container>
      </section>
    );
  }

  return (
    <section className={styles.sectionTight}>
      <Container>
        <Heading level="h2">Your licenses</Heading>
        <div className={styles.licenseList}>
          {licenses.map((license) => (
            <Card key={license.id} className={styles.panel}>
              <div className={styles.licenseRow}>
                <div>
                  <Text>
                    <strong>{license.game.title}</strong>
                  </Text>
                  <Text tone="muted">
                    {license.licenseKey} — {license.status}
                  </Text>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => setLicenseKey(license.licenseKey)}
                >
                  Activate
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
