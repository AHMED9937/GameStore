'use client';

import { Container, Heading } from '@gamestore/shared/ui';
import { CheckoutSuccessView } from './checkout-success-view';
import { CheckoutSuccessError } from './components/checkout-success-sections';
import { useOrderFulfillment } from './hooks/use-order-fulfillment';
import styles from './components/section.module.css';

export type CheckoutSuccessPageProps = {
  sessionId?: string | null;
};

export function CheckoutSuccessPage({ sessionId = null }: CheckoutSuccessPageProps) {
  const id = sessionId?.trim() ?? null;
  const fulfillmentState = useOrderFulfillment(id);

  return (
    <section className={styles.section}>
      <Container>
        <Heading level="h1">Order Complete</Heading>
        <div className={styles.content}>
          {!id ? (
            <CheckoutSuccessError message="Invalid checkout session." />
          ) : (
            <CheckoutSuccessView state={fulfillmentState} />
          )}
        </div>
      </Container>
    </section>
  );
}
