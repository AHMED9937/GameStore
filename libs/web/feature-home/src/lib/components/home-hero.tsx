import { Card, Container, Heading, Text } from '@gamestore/shared/ui';
import Link from 'next/link';
import styles from './section.module.css';

export function HomeHero() {
  return (
    <section className={styles.section}>
      <Container className={styles.heroGrid}>
        <div>
          <Heading level="h1" gradient>
            Next-Gen Offline Game Activations
          </Heading>
          <Text tone="muted" style={{ marginTop: '1rem', maxWidth: '32rem' }}>
            Gain instant access to a growing library of blockbuster titles. Keep your saves
            local and play with zero restrictions.
          </Text>
          <Link href="/shop" className={styles.heroCta}>
            Explore Games →
          </Link>
        </div>
        <Card className={styles.panel}>
          <Text tone="dim">HomeHero showcase — visual cards arrive with real catalog data.</Text>
        </Card>
      </Container>
    </section>
  );
}
