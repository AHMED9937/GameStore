import { Container, Heading, Text } from '@gamestore/shared/ui';
import styles from './section.module.css';

export function CatalogHero() {
  return (
    <section className={styles.section}>
      <Container>
        <Heading level="h1">Game Catalog</Heading>
        <Text tone="muted" style={{ marginTop: '0.75rem' }}>
          Browse offline activation titles across supported platforms.
        </Text>
      </Container>
    </section>
  );
}
