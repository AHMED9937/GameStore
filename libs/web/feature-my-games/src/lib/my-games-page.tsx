import { Container, Heading } from '@gamestore/shared/ui';
import { ActivationSteps } from './components/activation-steps';
import { CredentialsPanel } from './components/credentials-panel';
import { LicenseKeyForm } from './components/license-key-form';
import { MyLicensesPanel } from './components/my-licenses-panel';
import { SteamGuardPanel } from './components/steam-guard-panel';
import { ValidatedLicenseProvider } from './components/validated-license-context';
import styles from './components/section.module.css';

export function MyGamesPage() {
  return (
    <>
      <section className={styles.section}>
        <Container>
          <Heading level="h1">My Games</Heading>
        </Container>
      </section>
      <ValidatedLicenseProvider>
        <MyLicensesPanel />
        <LicenseKeyForm />
        <ActivationSteps />
        <CredentialsPanel />
        <SteamGuardPanel />
      </ValidatedLicenseProvider>
    </>
  );
}
