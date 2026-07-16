'use client';

import { useEffect, useState } from 'react';
import type { GameDetail } from '@gamestore/web/data-access';
import {
  formatGamePrice,
  resolveActiveGameDiscount,
} from '@gamestore/web/data-access';
import { GameDiscountBadge, GamePriceDisplay } from '@gamestore/shared/ui';
import { GameDetailBuyButton } from './game-detail-buy-cta';
import styles from './game-detail.module.css';

export type GameDetailStickyBuyBarProps = {
  game: Pick<
    GameDetail,
    'priceBase' | 'platform' | 'slug' | 'soldOut' | 'discount'
  >;
  /** Element that owns the in-page mobile CTA — when visible, dock hides. */
  heroCtaSelector?: string;
};

/**
 * Fixed bottom purchase dock for <1024px. Keeps Buy now + deal price
 * on screen while the user browses galleries and tabs.
 */
export function GameDetailStickyBuyBar({
  game,
  heroCtaSelector = '[data-testid="game-detail-buy-cta-mobile"]',
}: GameDetailStickyBuyBarProps) {
  const discount = resolveActiveGameDiscount(game);
  const [docked, setDocked] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      setDocked(true);
      return;
    }

    const hero = document.querySelector(heroCtaSelector);
    if (!hero) {
      setDocked(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setDocked(!entry.isIntersecting);
      },
      { root: null, threshold: 0.12, rootMargin: '-72px 0px 0px 0px' },
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, [heroCtaSelector]);

  return (
    <div
      className={[
        styles.stickyBuyDock,
        docked ? styles.stickyBuyDockVisible : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid="game-detail-sticky-buy"
      aria-hidden={!docked}
    >
      <div className={styles.stickyBuyInner}>
        <div className={styles.stickyBuyOffer}>
          {discount ? (
            <GameDiscountBadge
              percentOff={discount.percentOff}
              className={styles.stickyBuyBadge}
            />
          ) : null}
          <GamePriceDisplay
            size="sm"
            className={styles.stickyBuyPrice}
            priceBaseLabel={formatGamePrice(game.priceBase)}
            priceSaleLabel={
              discount ? formatGamePrice(discount.priceSale) : null
            }
            percentOff={discount?.percentOff ?? null}
            showPercentInline={false}
          />
        </div>
        <div className={styles.stickyBuyAction}>
          <GameDetailBuyButton
            slug={game.slug}
            soldOut={game.soldOut}
            free={
              formatGamePrice(
                discount ? discount.priceSale : game.priceBase,
              ) === 'Free'
            }
          />
        </div>
      </div>
    </div>
  );
}
