import { Card, Container, Heading, Text } from '@gamestore/shared/ui';
import styles from './section.module.css';

export { CheckoutPayment } from './checkout-payment';

export function CheckoutSummary() {
  return (
    <Card className={styles.panel}>
      <Heading level="h3">CheckoutSummary</Heading>
      <Text tone="muted" style={{ marginTop: '0.75rem' }}>
        Order summary will appear when checkout is connected.
      </Text>
    </Card>
  );
}

export function CheckoutTerms() {
  return (
    <Card className={styles.panel}>
      <Heading level="h3">CheckoutTerms</Heading>
      <Text tone="dim" style={{ marginTop: '0.75rem' }}>
        Terms and refund policy links — static shell.
      </Text>
    </Card>
  );
}
