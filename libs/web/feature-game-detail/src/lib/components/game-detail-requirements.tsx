import { Card, Container, Heading, Text } from '@gamestore/shared/ui';
import styles from './section.module.css';

export function GameDetailRequirements() {
  return (
    <section className={styles.sectionTight} style={{ paddingBottom: '3rem' }}>
      <Container>
        <Heading level="h2">GameDetailRequirements</Heading>
        <Card className={styles.panel} style={{ marginTop: '1rem' }}>
          <Text tone="muted">System requirements shell — content from API in Phase 6.</Text>
        </Card>
      </Container>
    </section>
  );
}
