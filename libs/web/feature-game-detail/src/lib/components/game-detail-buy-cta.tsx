import Link from 'next/link';
import type { GameDetail } from '@gamestore/web/data-access';
import {
  formatGamePrice,
  resolveActiveGameDiscount,
} from '@gamestore/web/data-access';
import {
  GameDealUrgency,
  GameDiscountBadge,
  GamePriceDisplay,
} from '@gamestore/shared/ui';
import styles from './game-detail.module.css';

export type GameDetailBuyCtaProps = {
  game: Pick<
    GameDetail,
    'priceBase' | 'platform' | 'slug' | 'soldOut' | 'discount'
  >;
};

function IconCart() {
  return (
    <svg
      className="btn-buy-now-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

export type GameDetailBuyButtonProps = {
  slug: string;
  soldOut?: boolean;
  /** Final price shown inside the CTA so the buyer sees exactly what they pay. */
  priceLabel?: string | null;
  /** Original price rendered struck-through under the final price. */
  wasPriceLabel?: string | null;
  /** Free games say "Get now"; paid games say "Buy now". Derived from priceLabel when omitted. */
  free?: boolean;
};

export function GameDetailBuyButton({
  slug,
  soldOut = false,
  priceLabel = null,
  wasPriceLabel = null,
  free = priceLabel === 'Free',
}: GameDetailBuyButtonProps) {
  if (soldOut) {
    return (
      <button type="button" className="btn-buy-now" disabled>
        Sold out
      </button>
    );
  }

  return (
    <Link
      href={`/checkout?game=${encodeURIComponent(slug)}`}
      className={priceLabel ? 'btn-buy-now btn-buy-now--split' : 'btn-buy-now'}
    >
      <span className="btn-buy-now-label">
        <IconCart />
        {free ? 'Get now' : 'Buy now'}
      </span>
      {priceLabel ? (
        <span className="btn-buy-now-price-block">
          <span className="btn-buy-now-price">{priceLabel}</span>
          {wasPriceLabel ? (
            <s className="btn-buy-now-was">was {wasPriceLabel}</s>
          ) : null}
        </span>
      ) : null}
    </Link>
  );
}

/** Above-the-fold mobile purchase card (sticky dock takes over when scrolled). */
export function GameDetailBuyCta({ game }: GameDetailBuyCtaProps) {
  const discount = resolveActiveGameDiscount(game);

  return (
    <div
      className="buy-cta-mobile-only"
      data-testid="game-detail-buy-cta-mobile"
    >
      {discount?.showCountdown ? (
        <div className={styles.buyCtaDealBanner}>
          <GameDealUrgency
            variant="banner"
            endsAt={discount.endsAt}
            showCountdown
          />
        </div>
      ) : null}
      <div className="buy-cta-bar">
        <div className="buy-cta-info">
          <div className={styles.buyCtaOfferRow}>
            {discount ? (
              <GameDiscountBadge
                percentOff={discount.percentOff}
                className={styles.buyCtaBadge}
              />
            ) : null}
            <div className="buy-cta-price">
              <GamePriceDisplay
                size="md"
                priceBaseLabel={formatGamePrice(game.priceBase)}
                priceSaleLabel={
                  discount ? formatGamePrice(discount.priceSale) : null
                }
                percentOff={discount?.percentOff ?? null}
                showPercentInline={false}
              />
            </div>
          </div>
          <p className="buy-cta-sub">
            {game.soldOut
              ? 'Currently unavailable for purchase'
              : discount
                ? 'Deal price locked at checkout'
                : 'Instant access after purchase'}
          </p>
        </div>
        <div className="buy-cta-action">
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
