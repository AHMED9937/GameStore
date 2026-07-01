'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Container,
  Heading,
  Input,
  Text,
} from '@gamestore/shared/ui';
import {
  ApiError,
  validateLicense,
} from '@gamestore/web/data-access';
import { useValidatedLicense } from './validated-license-context';
import styles from './section.module.css';

export function LicenseKeyForm() {
  const { licenseKey: selectedKey, setValidatedLicense, setStep } =
    useValidatedLicense();
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runValidate = useCallback(
    async (licenseKey: string) => {
      const trimmed = licenseKey.trim();
      if (!trimmed) {
        setError('Enter a license key');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await validateLicense(trimmed);
        setValidatedLicense({
          licenseKey: response.licenseKey,
          status: response.status,
          game: response.game,
        });
        setStep('pick-game');
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setError('License not found');
        } else if (err instanceof ApiError && err.status === 403) {
          const body = err.body.toLowerCase();
          if (body.includes('sign in')) {
            setError('Sign in to access this license');
          } else if (body.includes('revoked')) {
            setError('License has been revoked');
          } else {
            setError('You do not own this license');
          }
        } else {
          setError(
            err instanceof ApiError ? err.message : 'License validation failed',
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [setValidatedLicense, setStep],
  );

  useEffect(() => {
    if (selectedKey && selectedKey !== key) {
      setKey(selectedKey);
    }
  }, [selectedKey, key]);

  async function handleValidate() {
    await runValidate(key);
  }

  return (
    <section className={styles.sectionTight}>
      <Container>
        <Heading level="h2">Activate your license</Heading>
        <Card className={styles.panel} style={{ marginTop: '1rem' }}>
          <div className={styles.formStack}>
            <Input
              placeholder="Enter your license key"
              aria-label="License key"
              value={key}
              onChange={(event) => setKey(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void handleValidate();
                }
              }}
            />
            <Button
              variant="primary"
              onClick={() => void handleValidate()}
              disabled={loading}
            >
              {loading ? 'Validating…' : 'Validate license'}
            </Button>
            {error ? (
              <Text tone="muted">{error}</Text>
            ) : (
              <Text tone="dim">Enter a key from your purchase or email.</Text>
            )}
          </div>
        </Card>
      </Container>
    </section>
  );
}
