import { Container, Heading } from '@gamestore/shared/ui';
import {
  CheckoutPayment,
  CheckoutSummary,
  CheckoutTerms,
} from './components/checkout-sections';
import styles from './components/section.module.css';

export function CheckoutPage() {
  return (
    <section className={styles.section}>
      <Container>
        <Heading level="h1">Checkout</Heading>
        <div className={styles.twoCol} style={{ marginTop: '1.5rem' }}>
          <CheckoutSummary />
          <div>
            <CheckoutPayment />
            <div style={{ marginTop: '1rem' }}>
              <CheckoutTerms />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
