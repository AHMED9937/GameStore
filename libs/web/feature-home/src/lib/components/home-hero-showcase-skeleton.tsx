import { Container, Skeleton } from '@gamestore/shared/ui';
import styles from './section.module.css';

export function HomeHeroShowcaseSkeleton() {
  return (
    <div className={styles.showcaseCarousel} aria-hidden="true" data-testid="home-hero-showcase-skeleton">
      <div className={styles.showcaseStage}>
        <Skeleton width="18%" height={220} rounded="lg" className={styles.showcasePeekLeft} />
        <Skeleton width="64%" height={280} rounded="lg" />
        <Skeleton width="18%" height={220} rounded="lg" className={styles.showcasePeekRight} />
      </div>
      <div className={styles.showcaseThumbBar}>
        <Skeleton width={56} height={56} rounded="md" />
        <Skeleton width={56} height={56} rounded="md" />
        <Skeleton width={56} height={56} rounded="md" />
      </div>
    </div>
  );
}
