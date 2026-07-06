import { Container, Skeleton } from '@gamestore/shared/ui';
import styles from './section.module.css';

const SKELETON_CARD_COUNT = 8;

export function CatalogLoadingSkeleton() {
  return (
    <div data-testid="catalog-loading-skeleton" aria-busy="true" aria-label="Loading catalog">
      <section className={styles.section}>
        <Container>
          <Skeleton width="40%" height={40} rounded="sm" />
          <Skeleton width="70%" height={20} style={{ marginTop: '0.75rem' }} />
        </Container>
      </section>

      <section className={styles.sectionTight} aria-hidden="true">
        <Container>
          <Skeleton width="100%" height={42} style={{ maxWidth: '32rem' }} />
        </Container>
      </section>

      <section className={styles.sectionTight} aria-hidden="true">
        <Container>
          <div className={styles.filterBar}>
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} width={96} height={36} rounded="lg" />
            ))}
          </div>
        </Container>
      </section>

      <section className={styles.sectionTight} style={{ paddingBottom: '3rem' }} aria-hidden="true">
        <Container>
          <Skeleton width={160} height={18} />
          <div className={styles.grid}>
            {Array.from({ length: SKELETON_CARD_COUNT }).map((_, index) => (
              <div key={index} className={styles.panel}>
                <Skeleton width="100%" height="100%" style={{ aspectRatio: '3 / 4' }} rounded="md" />
                <Skeleton width="75%" height={20} style={{ marginTop: '0.75rem' }} />
                <Skeleton width="50%" height={16} style={{ marginTop: '0.5rem' }} />
                <Skeleton width="35%" height={16} style={{ marginTop: '0.5rem' }} />
              </div>
            ))}
          </div>
        </Container>
      </section>
    </div>
  );
}
