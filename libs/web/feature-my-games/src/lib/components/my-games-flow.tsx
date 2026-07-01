'use client';

import { LicenseGamePicker } from './license-game-picker';
import { LicenseKeyForm } from './license-key-form';
import { MyLicensesPanel } from './my-licenses-panel';
import { SteamCredentialsView } from './steam-credentials-view';
import { useValidatedLicense } from './validated-license-context';
import styles from './section.module.css';
import { Card, Container, Text } from '@gamestore/shared/ui';

function EnterStepHelp() {
  return (
    <section className={styles.sectionTight}>
      <Container>
        <Card className={styles.panel}>
          <Text tone="dim">
            Enter a license key from your purchase, or pick one from your account.
            You will select the game, then receive Steam login details and a live
            2FA code.
          </Text>
        </Card>
      </Container>
    </section>
  );
}

export function MyGamesFlow() {
  const { step } = useValidatedLicense();

  if (step === 'credentials') {
    return <SteamCredentialsView />;
  }

  if (step === 'pick-game') {
    return <LicenseGamePicker />;
  }

  return (
    <>
      <MyLicensesPanel />
      <LicenseKeyForm />
      <EnterStepHelp />
    </>
  );
}
