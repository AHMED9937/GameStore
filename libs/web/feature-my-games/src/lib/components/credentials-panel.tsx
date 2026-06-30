import { Card, Container, Heading, Text } from '@gamestore/shared/ui';
import styles from './section.module.css';

export function CredentialsPanel() {
  return (
    <section className={styles.sectionTight}>
      <Container>
        <Heading level="h2">CredentialsPanel</Heading>
        <Card className={styles.panel} style={{ marginTop: '1rem' }}>
          <Text tone="muted">Steam account credentials will display here after activation.</Text>
        </Card>
      </Container>
    </section>
  );
}
