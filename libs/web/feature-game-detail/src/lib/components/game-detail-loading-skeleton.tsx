import { Container, Skeleton } from '@gamestore/shared/ui';
import styles from './game-detail.module.css';

export function GameDetailLoadingSkeleton() {
  return (
    <section className={styles.section} data-testid="game-detail-loading-skeleton" aria-busy="true">
      <Container>
        <header>
          <Skeleton width="55%" height={44} rounded="sm" />
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <Skeleton width={88} height={28} rounded="lg" />
            <Skeleton width={120} height={28} rounded="lg" />
            <Skeleton width={96} height={28} rounded="lg" />
          </div>
          <Skeleton width={180} height={44} style={{ marginTop: '1.25rem' }} rounded="md" />
        </header>

        <div className={styles.layout} style={{ marginTop: '1.5rem' }}>
          <div className={styles.mainColumn}>
            <Skeleton width="100%" height={352} rounded="md" />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Skeleton width={120} height={68} rounded="md" />
              <Skeleton width={120} height={68} rounded="md" />
              <Skeleton width={120} height={68} rounded="md" />
            </div>
            <Skeleton width="100%" height={240} rounded="lg" />
          </div>

          <aside className={styles.sidebar}>
            <Skeleton width="100%" height={220} rounded="lg" />
          </aside>
        </div>
      </Container>
    </section>
  );
}
