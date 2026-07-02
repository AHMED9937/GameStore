'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Card, Container, Text } from '@gamestore/shared/ui';
import { SteamAccountLayout } from '@gamestore/web/feature-steam-access';
import {
  ApiError,
  activateLicense,
  apiErrorMessage,
} from '@gamestore/web/data-access';
import { SignInPrompt } from './sign-in-prompt';
import { useValidatedLicense } from './validated-license-context';
import styles from './section.module.css';

export function SteamCredentialsView() {
  const { licenseKey, validatedGame, reset } = useValidatedLicense();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signInRequired, setSignInRequired] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);

  useEffect(() => {
    const key = licenseKey?.trim();
    if (!key) {
      setLoading(false);
      setError('No license selected.');
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setSignInRequired(false);

      try {
        const result = await activateLicense(key);
        if (!cancelled) {
          setUsername(result.account.username);
          setPassword(result.account.password);
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 401) {
            setSignInRequired(true);
            setError('Sign in to access your Steam account.');
          } else {
            setError(
              apiErrorMessage(err, 'Could not activate license. Try again.'),
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
  }, [licenseKey]);

  if (signInRequired) {
    return <SignInPrompt />;
  }

  if (loading) {
    return (
      <section className={styles.sectionTight}>
        <Container>
          <Card className={styles.panel}>
            <Text tone="muted" role="status">
              Activating your Steam account…
            </Text>
          </Card>
        </Container>
      </section>
    );
  }

  if (error || !username || !password || !validatedGame || !licenseKey) {
    return (
      <section className={styles.sectionTight}>
        <Container>
          <Card className={styles.panel} data-testid="steam-credentials-error">
            <Text tone="muted">{error ?? 'Credentials unavailable.'}</Text>
            <Button variant="secondary" onClick={reset} style={{ marginTop: '1rem' }}>
              Choose another license
            </Button>
          </Card>
        </Container>
      </section>
    );
  }

  return (
    <section className={styles.sectionTight} data-testid="steam-credentials-view">
      <Container>
        <div className={styles.credentialsHeader}>
          <Button variant="secondary" onClick={reset}>
            Change license
          </Button>
        </div>
        <SteamAccountLayout
          game={validatedGame}
          username={username}
          password={password}
          licenseKey={licenseKey}
        />
        <Link href="/shop" className={styles.shopLink}>
          Browse more games
        </Link>
      </Container>
    </section>
  );
}
