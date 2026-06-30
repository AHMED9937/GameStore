import { Container, Input, Text } from '@gamestore/shared/ui';
import styles from './section.module.css';

export function CatalogSearch() {
  return (
    <section className={styles.sectionTight}>
      <Container>
        <Text tone="dim">CatalogSearch</Text>
        <div className={styles.searchRow}>
          <Input placeholder="Search games…" aria-label="Search games" readOnly />
        </div>
      </Container>
    </section>
  );
}
