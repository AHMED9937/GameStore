import type { GameDetail } from '@gamestore/web/data-access';
import {
  formatGamePrice,
  getGameCardCover,
  resolveActiveGameDiscount,
} from '@gamestore/web/data-access';
import {
  Card,
  GameDealUrgency,
  GameDiscountBadge,
  Text,
} from '@gamestore/shared/ui';
import { GameDetailBuyButton } from './game-detail-buy-cta';
import styles from './game-detail.module.css';

export type GameDetailBuyPanelProps = {
  game: Pick<
    GameDetail,
    | 'title'
    | 'priceBase'
    | 'coverImage'
    | 'coverCardImage'
    | 'platform'
    | 'slug'
    | 'soldOut'
    | 'discount'
  >;
};

/**
 * Shop-style purchase card: countdown → full 3:4 cover → Buy CTA with price.
 * Cover frame matches box-art ratio so nothing is padded with empty bleed.
 */
export function GameDetailBuyPanel({ game }: GameDetailBuyPanelProps) {
  const coverSrc = getGameCardCover(game);
  const discount = resolveActiveGameDiscount(game);

  return (
    <Card className={styles.buyPanel} data-testid="game-detail-buy-panel">
      {discount?.showCountdown ? (
        <div className={styles.buyDealBanner}>
          <GameDealUrgency
            variant="banner"
            endsAt={discount.endsAt}
            showCountdown
          />
        </div>
      ) : null}

      <div className={styles.buyBody}>
        <div className={styles.buyCoverWrap}>
          <img
            src={coverSrc}
            alt=""
            className={styles.buyCover}
            loading="lazy"
          />
          {discount ? (
            <GameDiscountBadge
              percentOff={discount.percentOff}
              className={styles.buyDiscountBadge}
            />
          ) : null}
        </div>

        <div className={styles.buyOfferBlock}>
          <div className={styles.buyAction}>
            <GameDetailBuyButton
              slug={game.slug}
              soldOut={game.soldOut}
              priceLabel={formatGamePrice(
                discount ? discount.priceSale : game.priceBase,
              )}
              wasPriceLabel={
                discount ? formatGamePrice(game.priceBase) : null
              }
            />
          </div>
          <Text tone="dim" className={styles.buySecureNote}>
            {game.soldOut
              ? 'Currently sold out.'
              : 'Secure checkout · Instant delivery'}
          </Text>
        </div>
      </div>
    </Card>
  );
}
