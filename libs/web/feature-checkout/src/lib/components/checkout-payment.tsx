'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Card, Heading, Text } from '@gamestore/shared/ui';
import {
  ApiError,
  apiErrorMessage,
  createCheckout,
  formatGamePrice,
  getGameDisplayPrice,
  getPaymentsHealth,
  type GameDetail,
} from '@gamestore/web/data-access';
import styles from './section.module.css';

export type CheckoutPaymentProps = {
  game: Pick<GameDetail, 'id' | 'slug' | 'priceBase' | 'discount'>;
};

type PolicyKey = 'terms' | 'privacy' | 'refund';

const POLICY_ROUTES: Record<PolicyKey, string> = {
  terms: '/terms-of-service',
  privacy: '/privacy-policy',
  refund: '/refund-policy',
};

/** Short in-place summaries so buyers can read policies without leaving checkout. */
const POLICY_SUMMARIES: Record<PolicyKey, { title: string; body: string }> = {
  terms: {
    title: 'Terms of Service',
    body: 'Your purchase grants a personal license to play through a shared offline-activated account. Keep the account credentials unchanged and use it on one device at a time.',
  },
  privacy: {
    title: 'Privacy Policy',
    body: 'We use your email and order details only to deliver your purchase and provide support. Payments are handled by Stripe — we never see or store your card details, and we never sell your data.',
  },
  refund: {
    title: 'Refund Policy',
    body: 'If activation fails and our support team cannot fix it, you get a replacement or a full refund. Contact support any time from your account page.',
  },
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
      return 'Could not start checkout. Product image URL is invalid for Stripe use an HTTPS cover URL or leave cover empty.';
    }
  }

  return apiErrorMessage(error, 'Checkout request failed. Please try again.');
}

export function CheckoutPayment({ game }: CheckoutPaymentProps) {
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signInRequired, setSignInRequired] = useState(false);
  const [webhookNote, setWebhookNote] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [openPolicy, setOpenPolicy] = useState<PolicyKey | null>(null);

  const { priceBase, priceSale, percentOff } = getGameDisplayPrice(game);
  const isFree = priceSale !== null && Number(priceSale) === 0;
  const finalPrice = priceSale ?? priceBase;
  const saved = priceSale !== null ? Number(priceBase) - Number(priceSale) : 0;

  useEffect(() => {
    if (isFree || process.env.NODE_ENV === 'production') {
      return;
    }

    void getPaymentsHealth()
      .then((health) => {
        if (health.env.webhookSecret === 'missing') {
          setWebhookNote(
            'Local dev: licenses issue on the success page even without webhook forwarding. For production-like flow, run stripe listen and set STRIPE_WEBHOOK_SECRET.',
          );
        }
      })
      .catch(() => undefined);
  }, [isFree]);

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
      <Heading level="h3">
        {isFree ? 'Claim your game' : 'Complete your order'}
      </Heading>
      <Text tone="muted" style={{ marginTop: '0.75rem' }}>
        {isFree
          ? 'This game is free — claim it instantly, no payment required.'
          : 'You are one click away — pay securely and start playing.'}
      </Text>
      {saved > 0 ? (
        <p className={styles.savingsCallout} data-testid="checkout-savings">
          You&apos;re saving ${saved.toFixed(2)}
          {percentOff ? ` (${percentOff}% off)` : ''} on this order
        </p>
      ) : null}
      <ul className={styles.valueList}>
        <li className={styles.valueItem}>
          <span className={styles.valueCheck} aria-hidden>
            ✓
          </span>
          Instant delivery — play within minutes
        </li>
        <li className={styles.valueItem}>
          <span className={styles.valueCheck} aria-hidden>
            ✓
          </span>
          Warranty-backed support
        </li>
        <li className={styles.valueItem}>
          <span className={styles.valueCheck} aria-hidden>
            ✓
          </span>
          Secure payment powered by Stripe
        </li>
      </ul>
      {webhookNote ? (
        <Text tone="muted" style={{ marginTop: '0.75rem' }}>
          {webhookNote}
        </Text>
      ) : null}
      <label className={styles.termsRow}>
        <span
          className={`${styles.termsCheckboxShell}${
            accepted ? ` ${styles.termsCheckboxShellChecked}` : ''
          }`}
          aria-hidden
        >
          <input
            type="checkbox"
            className={styles.termsCheckbox}
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
            data-testid="checkout-terms-checkbox"
          />
        </span>
        <span className={styles.termsText}>
          I agree to the{' '}
          {(['terms', 'privacy', 'refund'] as const).map((key, index) => (
            <span key={key}>
              {index === 2 ? ' and ' : index === 1 ? ', ' : ''}
              <button
                type="button"
                className={styles.policyLink}
                onClick={(event) => {
                  event.preventDefault();
                  setOpenPolicy((open) => (open === key ? null : key));
                }}
              >
                {POLICY_SUMMARIES[key].title}
              </button>
            </span>
          ))}
        </span>
      </label>
      {openPolicy ? (
        <div className={styles.policyPeek} data-testid="checkout-policy-peek">
          <strong>{POLICY_SUMMARIES[openPolicy].title}</strong>
          <p>{POLICY_SUMMARIES[openPolicy].body}</p>
          <Link
            href={POLICY_ROUTES[openPolicy]}
            className={styles.policyFullLink}
            data-testid="checkout-policy-full-link"
          >
            Read full {POLICY_SUMMARIES[openPolicy].title}
          </Link>
        </div>
      ) : null}
      <button
        type="button"
        className={`btn-buy-now btn-buy-now--split ${styles.payButton}`}
        onClick={handlePay}
        disabled={paying || !accepted}
        data-testid={
          paying
            ? isFree
              ? 'checkout-claim-loading'
              : 'checkout-pay-loading'
            : isFree
              ? 'checkout-claim-button'
              : 'checkout-pay-button'
        }
      >
        <span className="btn-buy-now-label">
          {paying ? 'Redirecting…' : isFree ? 'Claim free game' : 'Pay now'}
        </span>
        <span className="btn-buy-now-price-block">
          <span className="btn-buy-now-price">
            {formatGamePrice(finalPrice)}
          </span>
          {saved > 0 ? (
            <s className="btn-buy-now-was">was {formatGamePrice(priceBase)}</s>
          ) : null}
        </span>
      </button>
      <Text tone="dim" className={styles.trustNote}>
        🔒 Secured by Stripe · Instant delivery after payment
      </Text>
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
