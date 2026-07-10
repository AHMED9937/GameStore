'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Button, Card, Heading, SkeletonPanel, SkeletonText, Text } from '@gamestore/shared/ui';
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
    <div data-testid="checkout-success-pending">
      <SkeletonText width="45%" />
      <SkeletonText width="70%" style={{ marginTop: '0.5rem' }} />
      <SkeletonPanel height={72} style={{ marginTop: '0.75rem' }} aria-label={message} />
    </div>
  );
}

export function CheckoutSuccessLoading() {
  return (
    <div data-testid="checkout-success-loading">
      <SkeletonText width="50%" />
      <SkeletonPanel height={88} style={{ marginTop: '0.75rem' }} />
    </div>
  );
}

export function CheckoutSuccessError({
  message,
  signInHref,
}: {
  message: string;
  signInHref?: string;
}) {
  return (
    <div
      className={`${styles.banner} ${styles.bannerError}`}
      role="alert"
      data-testid="checkout-success-error"
    >
      <p>{message}</p>
      <div className={styles.errorActions}>
        {signInHref ? (
          <Link href={signInHref} className={styles.shopLink}>
            Sign in
          </Link>
        ) : null}
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
