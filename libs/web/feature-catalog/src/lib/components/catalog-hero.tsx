import { Container, Heading, Text } from '@gamestore/shared/ui';
import { CATALOG_HERO_DESCRIPTION } from '../catalog.constants';
import styles from './section.module.css';

export function CatalogHero() {
  return (
    <section className={styles.section}>
      <Container>
        <Heading level="h1">Game Catalog</Heading>
        <Text tone="muted" className={styles.heroLead}>
          {CATALOG_HERO_DESCRIPTION}
        </Text>
      </Container>
    </section>
  );
}
