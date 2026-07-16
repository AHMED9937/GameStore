'use client';

import type { GameDetail } from '@gamestore/web/data-access';
import {
  getGameCardCover,
  resolveActiveGameDiscount,
} from '@gamestore/web/data-access';
import {
  Card,
  GameDealUrgency,
  Heading,
  Text,
} from '@gamestore/shared/ui';
import { GameDetailPlatformStrip } from '@gamestore/web/feature-game-detail';
import styles from './section.module.css';

export { CheckoutPayment } from './checkout-payment';

export type CheckoutSummaryProps = {
  game: GameDetail;
};

export function CheckoutSummary({ game }: CheckoutSummaryProps) {
  const coverSrc = getGameCardCover(game);
  const discount = resolveActiveGameDiscount(game);

  return (
    <Card className={styles.panel}>
      {discount?.showCountdown ? (
        <div className={styles.summaryDealBanner}>
          <GameDealUrgency
            variant="bannerLg"
            endsAt={discount.endsAt}
            showCountdown
          />
        </div>
      ) : null}
      <Heading level="h3">Order summary</Heading>
      <div className={styles.summaryCoverWrap}>
        <img
          src={coverSrc}
          alt=""
          className={styles.summaryCover}
          loading="lazy"
        />
      </div>
      <Text style={{ marginTop: '1rem', fontSize: '1.125rem', fontWeight: 600 }}>
        {game.title}
      </Text>
      <div className={styles.summaryPlatform}>
        <GameDetailPlatformStrip platform={game.platform} compact />
      </div>
    </Card>
  );
}
