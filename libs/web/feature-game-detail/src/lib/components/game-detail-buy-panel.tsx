import type { GameDetail } from '@gamestore/web/data-access';
import { formatGamePrice } from '@gamestore/web/data-access';
import { Badge, Card, Heading, Text } from '@gamestore/shared/ui';
import { formatPlatformLabel } from '../game-detail.utils';
import { GameDetailBuyButton } from './game-detail-buy-cta';
import styles from './game-detail.module.css';

export type GameDetailBuyPanelProps = {
  game: Pick<GameDetail, 'title' | 'priceBase' | 'coverImage' | 'platform' | 'slug'>;
};

export function GameDetailBuyPanel({ game }: GameDetailBuyPanelProps) {
  return (
    <Card className={styles.buyPanel} data-testid="game-detail-buy-panel">
      {game.coverImage ? (
        <img src={game.coverImage} alt="" className={styles.buyCover} loading="lazy" />
      ) : null}
      <Heading level="h2" style={{ fontSize: '1.25rem', marginTop: '1rem' }}>
        {game.title}
      </Heading>
      <Badge variant="default" className={styles.buyBadge}>
        {formatPlatformLabel(game.platform)}
      </Badge>
      <Text style={{ marginTop: '1rem', fontSize: '1.75rem', fontWeight: 600 }}>
        {formatGamePrice(game.priceBase)}
      </Text>
      <div style={{ marginTop: '1.25rem' }}>
        <GameDetailBuyButton slug={game.slug} />
      </div>
      <Text tone="muted" style={{ marginTop: '0.75rem' }}>
        Secure checkout powered by Stripe.
      </Text>
    </Card>
  );
}
