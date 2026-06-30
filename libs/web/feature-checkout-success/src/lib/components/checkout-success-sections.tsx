import { Card, Container, Heading, Text } from '@gamestore/shared/ui';
import styles from './section.module.css';

export function CheckoutSuccessMessage() {
  return (
    <Card className={styles.panel}>
      <Heading level="h2">CheckoutSuccessMessage</Heading>
      <Text tone="muted" style={{ marginTop: '0.75rem' }}>
        Thank you — your order was received. License delivery is wired in a later phase.
      </Text>
    </Card>
  );
}

export function CheckoutLicenseDisplay() {
  return (
    <Card className={styles.panel}>
      <Heading level="h3">CheckoutLicenseDisplay</Heading>
      <Text tone="dim" style={{ marginTop: '0.75rem' }}>
        License key will display here after payment is implemented.
      </Text>
    </Card>
  );
}
