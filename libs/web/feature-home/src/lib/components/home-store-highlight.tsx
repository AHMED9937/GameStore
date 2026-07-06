import { Container, Text } from '@gamestore/shared/ui';
import { STORE_TRUST_LINE } from '../home.constants';
import styles from './section.module.css';

export function HomeStoreHighlight() {
  return (
    <section className={styles.storeTrustBar} aria-label="Store trust">
      <Container>
        <Text tone="dim" className={styles.storeTrustText}>
          {STORE_TRUST_LINE}
        </Text>
      </Container>
    </section>
  );
}
