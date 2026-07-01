'use client';

import type { GameDetail } from '@gamestore/web/data-access';
import { formatGamePrice } from '@gamestore/web/data-access';
import { Badge, Card, Heading, Text } from '@gamestore/shared/ui';
import styles from './section.module.css';

export { CheckoutPayment } from './checkout-payment';

function formatPlatformLabel(platform: string): string {
  switch (platform.toLowerCase()) {
    case 'steam':
      return 'Steam';
    case 'epic':
      return 'Epic Games';
    case 'microsoft':
    case 'xbox':
      return 'Microsoft Store';
    default:
      return platform;
  }
}

export type CheckoutSummaryProps = {
  game: GameDetail;
};

export function CheckoutSummary({ game }: CheckoutSummaryProps) {
  return (
    <Card className={styles.panel}>
      <Heading level="h3">Order summary</Heading>
      {game.coverImage ? (
        <img
          src={game.coverImage}
          alt=""
          className={styles.summaryCover}
          loading="lazy"
        />
      ) : null}
      <Text style={{ marginTop: '1rem', fontSize: '1.125rem', fontWeight: 600 }}>
        {game.title}
      </Text>
      <Badge variant="default" style={{ marginTop: '0.75rem' }}>
        {formatPlatformLabel(game.platform)}
      </Badge>
      <Text style={{ marginTop: '1rem', fontSize: '1.5rem', fontWeight: 600 }}>
        {formatGamePrice(game.priceBase)}
      </Text>
      <Text tone="muted" style={{ marginTop: '0.75rem' }}>
        Instant license delivery after payment.
      </Text>
    </Card>
  );
}

export function CheckoutTerms() {
  return (
    <Card className={styles.panel}>
      <Heading level="h3">Before you pay</Heading>
      <Text tone="dim" style={{ marginTop: '0.75rem' }}>
        Purchases grant a license for shared-account access. Refunds are handled per
        store policy. By paying you agree to these terms.
      </Text>
    </Card>
  );
}
