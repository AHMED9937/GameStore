import { Container, Text } from '@gamestore/shared/ui';
import styles from './section.module.css';

const FILTERS = ['All Games', 'Steam', 'Epic Games', 'Ubisoft'] as const;

export function CatalogFilters() {
  return (
    <section className={styles.sectionTight}>
      <Container>
        <Text tone="dim">CatalogFilters</Text>
        <div className={styles.filterBar}>
          {FILTERS.map((label, index) => (
            <span
              key={label}
              className={[styles.filterBtn, index === 0 ? styles.filterBtnActive : '']
                .filter(Boolean)
                .join(' ')}
            >
              {label}
            </span>
          ))}
        </div>
      </Container>
    </section>
  );
}
