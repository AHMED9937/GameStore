'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Button, Card, Heading, Text } from '@gamestore/shared/ui';
import type { OrderLicense } from '@gamestore/web/data-access';
import styles from './section.module.css';

export function CheckoutSuccessMessage({
  gameTitle,
}: {
  gameTitle?: string;
}) {
  return (
    <Card className={styles.panel}>
      <Heading level="h2">Thank you for your purchase</Heading>
      <Text tone="muted" style={{ marginTop: '0.75rem' }}>
        {gameTitle
          ? `Your license for ${gameTitle} is ready.`
          : 'Your order was received successfully.'}
      </Text>
    </Card>
  );
}

export function CheckoutLicenseDisplay({ license }: { license: OrderLicense }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(license.licenseKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [license.licenseKey]);

  return (
    <Card className={styles.panel} data-testid="checkout-success-ready">
      <Heading level="h3">Your license key</Heading>
      <Text tone="muted" style={{ marginTop: '0.5rem' }}>
        {license.game.title}
      </Text>
      <div className={styles.licenseRow}>
        <code className={styles.licenseKey} data-testid="checkout-license-key">
          {license.licenseKey}
        </code>
        <Button variant="secondary" onClick={() => void handleCopy()}>
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>
      <Link href="/my-games" className={styles.myGamesLink}>
        Go to My Games
      </Link>
    </Card>
  );
}

export function CheckoutSuccessPending({ message }: { message: string }) {
  return (
    <div
      className={styles.loading}
      role="status"
      aria-live="polite"
      data-testid="checkout-success-pending"
    >
      <p className={styles.loadingTitle}>Processing your order…</p>
      <p className={styles.loadingHint}>{message}</p>
    </div>
  );
}

export function CheckoutSuccessLoading() {
  return (
    <div
      className={styles.loading}
      role="status"
      aria-live="polite"
      data-testid="checkout-success-loading"
    >
      <p className={styles.loadingTitle}>Confirming your payment…</p>
    </div>
  );
}

export function CheckoutSuccessError({ message }: { message: string }) {
  return (
    <div
      className={`${styles.banner} ${styles.bannerError}`}
      role="alert"
      data-testid="checkout-success-error"
    >
      <p>{message}</p>
      <div className={styles.errorActions}>
        <Link href="/shop" className={styles.shopLink}>
          Browse games
        </Link>
        <Link href="/my-games" className={styles.shopLink}>
          My Games
        </Link>
      </div>
    </div>
  );
}
