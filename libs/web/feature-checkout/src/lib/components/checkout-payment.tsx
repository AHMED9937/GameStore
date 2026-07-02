'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Card, Heading, Text } from '@gamestore/shared/ui';
import {
  ApiError,
  apiErrorMessage,
  createCheckout,
  type GameDetail,
} from '@gamestore/web/data-access';
import styles from './section.module.css';

export type CheckoutPaymentProps = {
  game: Pick<GameDetail, 'id' | 'slug'>;
};

function isValidCheckoutUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function checkoutErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const body = error.body.toLowerCase();
    if (body.includes('url') || body.includes('images')) {
      return 'Could not start checkout. Product image URL is invalid for Stripe — use an HTTPS cover URL or leave cover empty.';
    }
  }

  return apiErrorMessage(error, 'Checkout request failed. Please try again.');
}

export function CheckoutPayment({ game }: CheckoutPaymentProps) {
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signInRequired, setSignInRequired] = useState(false);

  async function handlePay() {
    setPaying(true);
    setError(null);
    setSignInRequired(false);

    try {
      const response = await createCheckout({ slug: game.slug });
      if (!response.url || !isValidCheckoutUrl(response.url)) {
        setError('Invalid checkout URL from server. Check Stripe configuration.');
        setPaying(false);
        return;
      }
      window.location.assign(response.url);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setSignInRequired(true);
      }
      setError(checkoutErrorMessage(err));
      setPaying(false);
    }
  }

  const checkoutRedirect = `/checkout?game=${encodeURIComponent(game.slug)}`;

  return (
    <Card className={styles.panel}>
      <Heading level="h3">Payment</Heading>
      <Text tone="muted" style={{ marginTop: '0.75rem' }}>
        You will be redirected to Stripe secure checkout.
      </Text>
      <Button
        variant="primary"
        onClick={handlePay}
        disabled={paying}
        style={{ marginTop: '1rem' }}
        data-testid={paying ? 'checkout-pay-loading' : 'checkout-pay-button'}
      >
        {paying ? 'Redirecting to secure checkout…' : 'Pay with card'}
      </Button>
      {error ? (
        <div
          className={`${styles.banner} ${styles.bannerError}`}
          role="alert"
          style={{ marginTop: '1rem' }}
        >
          <p>{error}</p>
          {signInRequired ? (
            <Link
              href={`/sign-in?redirect_url=${encodeURIComponent(checkoutRedirect)}`}
              className={styles.shopLink}
            >
              Sign in to continue
            </Link>
          ) : (
            <Button
              variant="secondary"
              onClick={handlePay}
              disabled={paying}
              style={{ marginTop: '0.75rem' }}
            >
              Retry
            </Button>
          )}
        </div>
      ) : null}
    </Card>
  );
}
