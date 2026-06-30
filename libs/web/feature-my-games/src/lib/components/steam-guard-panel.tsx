'use client';

import { useState } from 'react';
import { Button, Card, Container, Heading, Text } from '@gamestore/shared/ui';
import { ApiError, requestSteamGuardCode } from '@gamestore/web/data-access';
import styles from './section.module.css';
import { useValidatedLicense } from './validated-license-context';

export function SteamGuardPanel() {
  const { licenseKey } = useValidatedLicense();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRequestCode() {
    setLoading(true);
    setError(null);

    try {
      const response = await requestSteamGuardCode(licenseKey);
      setMessage(response.message);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Steam Guard request failed',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={styles.sectionTight} style={{ paddingBottom: '3rem' }}>
      <Container>
        <Heading level="h2">SteamGuardPanel</Heading>
        <Card className={styles.panel} style={{ marginTop: '1rem' }}>
          <Button
            variant="primary"
            onClick={handleRequestCode}
            disabled={loading}
          >
            {loading ? 'Loading…' : 'Request Steam Guard code'}
          </Button>
          {message ? <p className={styles.setupMessage}>{message}</p> : null}
          {error ? (
            <Text tone="muted" style={{ marginTop: '0.75rem' }}>
              {error}
            </Text>
          ) : (
            <Text tone="dim" style={{ marginTop: '0.75rem' }}>
              TOTP codes will be requested from the API in a later phase.
            </Text>
          )}
        </Card>
      </Container>
    </section>
  );
}
