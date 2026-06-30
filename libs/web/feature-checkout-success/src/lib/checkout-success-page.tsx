import { Container, Heading } from '@gamestore/shared/ui';
import {
  CheckoutLicenseDisplay,
  CheckoutSuccessMessage,
} from './components/checkout-success-sections';
import styles from './components/section.module.css';

export function CheckoutSuccessPage() {
  return (
    <section className={styles.section}>
      <Container>
        <Heading level="h1">Order Complete</Heading>
        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <CheckoutSuccessMessage />
          <CheckoutLicenseDisplay />
        </div>
      </Container>
    </section>
  );
}
