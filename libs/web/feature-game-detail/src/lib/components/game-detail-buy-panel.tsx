import type { GameDetail } from '@gamestore/web/data-access';
import { formatGamePrice, getGameCardCover } from '@gamestore/web/data-access';
import { Card, Heading, Text } from '@gamestore/shared/ui';
import { GameDetailBuyButton } from './game-detail-buy-cta';
import { GameDetailPlatformStrip } from './game-detail-platform-strip';
import styles from './game-detail.module.css';

export type GameDetailBuyPanelProps = {
  game: Pick<
    GameDetail,
    'title' | 'priceBase' | 'coverImage' | 'coverCardImage' | 'platform' | 'slug' | 'soldOut'
  >;
};

export function GameDetailBuyPanel({ game }: GameDetailBuyPanelProps) {
  const coverSrc = getGameCardCover(game);

  return (
    <Card className={styles.buyPanel} data-testid="game-detail-buy-panel">
      <img src={coverSrc} alt="" className={styles.buyCover} loading="lazy" />
      <Heading level="h2" style={{ fontSize: '1.25rem', marginTop: '1rem' }}>
        {game.title}
      </Heading>
      <GameDetailPlatformStrip platform={game.platform} />
      <Text style={{ marginTop: '1rem', fontSize: '1.75rem', fontWeight: 600 }}>
        {formatGamePrice(game.priceBase)}
      </Text>
      <div style={{ marginTop: '1.25rem' }}>
        <GameDetailBuyButton slug={game.slug} soldOut={game.soldOut} />
      </div>
      <Text tone="muted" style={{ marginTop: '0.75rem' }}>
        {game.soldOut
          ? 'This game is currently sold out.'
          : 'Secure checkout powered by Stripe.'}
      </Text>
    </Card>
  );
}
