'use client';

import { Button, Card, Container, Heading, Text } from '@gamestore/shared/ui';
import { useValidatedLicense } from './validated-license-context';
import styles from './section.module.css';

export function LicenseGamePicker() {
  const { validatedGame, licenseStatus, licenseKey, setStep } =
    useValidatedLicense();

  if (!validatedGame || !licenseKey) {
    return null;
  }

  if (licenseStatus === 'revoked') {
    return (
      <section className={styles.sectionTight}>
        <Container>
          <Card className={styles.panel}>
            <Text tone="muted">This license has been revoked.</Text>
          </Card>
        </Container>
      </section>
    );
  }

  const coverSrc = validatedGame.coverImage?.trim() || '/og/default.png';

  return (
    <section className={styles.sectionTight} data-testid="license-game-picker">
      <Container>
        <Heading level="h2">Select your game</Heading>
        <Card className={styles.panel} style={{ marginTop: '1rem' }}>
          <div className={styles.pickerCard}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={styles.pickerCover}
              src={coverSrc}
              alt={validatedGame.title}
            />
            <div className={styles.pickerBody}>
              <Heading level="h3">{validatedGame.title}</Heading>
              <Text tone="muted" style={{ marginTop: '0.5rem' }}>
                License status: {licenseStatus}
              </Text>
              <Button
                variant="primary"
                style={{ marginTop: '1rem' }}
                data-testid="access-steam-account"
                onClick={() => setStep('credentials')}
              >
                Access Steam account
              </Button>
            </div>
          </div>
        </Card>
      </Container>
    </section>
  );
}
