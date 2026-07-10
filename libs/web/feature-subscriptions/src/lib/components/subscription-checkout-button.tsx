'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, SkeletonButton, Text } from '@gamestore/shared/ui';
import {
  ApiError,
  apiErrorMessage,
  createSubscriptionCheckout,
} from '@gamestore/web/data-access';
import styles from './section.module.css';

export type SubscriptionCheckoutButtonProps = {
  planSlug: string;
};

function isValidCheckoutUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function SubscriptionCheckoutButton({
  planSlug,
}: SubscriptionCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signInRequired, setSignInRequired] = useState(false);

  const redirectPath = `/subscriptions?plan=${encodeURIComponent(planSlug)}`;

  async function handleSubscribe() {
    setLoading(true);
    setError(null);
    setSignInRequired(false);

    try {
      const response = await createSubscriptionCheckout({ planSlug });
      if (!response.url || !isValidCheckoutUrl(response.url)) {
        setError('Invalid checkout URL from server. Check Stripe configuration.');
        setLoading(false);
        return;
      }
      window.location.assign(response.url);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setSignInRequired(true);
      }
      setError(apiErrorMessage(err, 'Could not start subscription checkout.'));
      setLoading(false);
    }
  }

  return (
    <div>
      <Button
        variant="primary"
        onClick={() => void handleSubscribe()}
        disabled={loading}
        data-testid={
          loading ? 'subscription-checkout-loading' : 'subscription-checkout-button'
        }
      >
        {loading ? (
          <SkeletonButton width="100%" height={20} rounded="sm" />
        ) : (
          'Subscribe with card'
        )}
      </Button>
      {error ? (
        <div
          className={`${styles.banner} ${styles.bannerError}`}
          role="alert"
        >
          <Text>{error}</Text>
          {signInRequired ? (
            <Link
              href={`/sign-in?redirect_url=${encodeURIComponent(redirectPath)}`}
              className={styles.signInLink}
            >
              Sign in to subscribe
            </Link>
          ) : (
            <Button
              variant="secondary"
              onClick={() => void handleSubscribe()}
              disabled={loading}
              style={{ marginTop: '0.75rem' }}
            >
              Retry
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
