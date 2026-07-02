import Link from 'next/link';
import type { GameDetail } from '@gamestore/web/data-access';
import { formatGamePrice } from '@gamestore/web/data-access';
import { formatPlatformLabel } from '../game-detail.utils';

export type GameDetailBuyCtaProps = {
  game: Pick<GameDetail, 'priceBase' | 'platform' | 'slug'>;
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
};

export function GameDetailBuyButton({ slug }: GameDetailBuyButtonProps) {
  return (
    <Link
      href={`/checkout?game=${encodeURIComponent(slug)}`}
      className="btn-buy-now"
    >
      <IconCart />
      Buy now
    </Link>
  );
}

export function GameDetailBuyCta({ game }: GameDetailBuyCtaProps) {
  return (
    <div className="buy-cta-mobile-only" data-testid="game-detail-buy-cta-mobile">
      <div className="buy-cta-bar">
        <div className="buy-cta-info">
          <p className="buy-cta-price">{formatGamePrice(game.priceBase)}</p>
          <p className="buy-cta-sub">
            {formatPlatformLabel(game.platform)} · Instant access after purchase
          </p>
        </div>
        <div className="buy-cta-action">
          <GameDetailBuyButton slug={game.slug} />
        </div>
      </div>
    </div>
  );
}
