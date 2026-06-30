'use client';

import { useState } from 'react';
import { Button, Card, Heading, Text } from '@gamestore/shared/ui';
import { ApiError, createCheckout } from '@gamestore/web/data-access';
import styles from './section.module.css';

export function CheckoutPayment() {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setLoading(true);
    setError(null);

    try {
      const response = await createCheckout();
      setMessage(response.message);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Checkout request failed',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className={styles.panel}>
      <Heading level="h3">CheckoutPayment</Heading>
      <Button
        variant="primary"
        onClick={handlePay}
        disabled={loading}
        style={{ marginTop: '1rem' }}
      >
        {loading ? 'Loading…' : 'Pay with card'}
      </Button>
      {message ? <p className={styles.setupMessage}>{message}</p> : null}
      {error ? (
        <Text tone="muted" style={{ marginTop: '0.75rem' }}>
          {error}
        </Text>
      ) : null}
    </Card>
  );
}
