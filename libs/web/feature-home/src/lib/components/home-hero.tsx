import { Container, Heading } from '@gamestore/shared/ui';
import Link from 'next/link';
import { Suspense } from 'react';
import { HERO_LEAD } from '../home.constants';
import { HomeHeroShowcase } from './home-hero-showcase';
import { HomeHeroShowcaseSkeleton } from './home-hero-showcase-skeleton';
import styles from './section.module.css';

export function HomeHero() {
  return (
    <section className={styles.section}>
      <Container className={styles.heroGrid}>
        <div className={styles.heroCopy}>
          <Heading level="h1" gradient>
            Next-Gen Offline Game Activations
          </Heading>
          <p className={styles.heroLead}>{HERO_LEAD}</p>
          <Link href="/shop" className={styles.heroCta}>
            Explore Games →
          </Link>
        </div>
        <Suspense fallback={<HomeHeroShowcaseSkeleton />}>
          <HomeHeroShowcase />
        </Suspense>
      </Container>
    </section>
  );
}
