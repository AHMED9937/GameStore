import { Container, Heading } from '@gamestore/shared/ui';
import { MyGamesFlow } from './components/my-games-flow';
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
        <MyGamesFlow />
      </ValidatedLicenseProvider>
    </>
  );
}
