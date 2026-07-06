import Link from 'next/link';
import type { GameDetail } from '@gamestore/web/data-access';
import { formatGamePrice } from '@gamestore/web/data-access';
import {
  formatPlatformLabel,
  getPlatformAccessBadgeLabel,
  getPlatformAccessMode,
} from '../game-detail.utils';
import { GameDetailPlatformIcon } from './game-detail-platform-icon';
import styles from './game-detail.module.css';

export type GameDetailBuyCtaProps = {
  game: Pick<GameDetail, 'priceBase' | 'platform' | 'slug' | 'soldOut'>;
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
};

export function GameDetailBuyButton({ slug, soldOut = false }: GameDetailBuyButtonProps) {
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
      className="btn-buy-now"
    >
      <IconCart />
      Buy now
    </Link>
  );
}

export function GameDetailBuyCta({ game }: GameDetailBuyCtaProps) {
  const mode = getPlatformAccessMode(game.platform);

  return (
    <div className="buy-cta-mobile-only" data-testid="game-detail-buy-cta-mobile">
      <div className="buy-cta-bar">
        <div className="buy-cta-info">
          <p className="buy-cta-price">{formatGamePrice(game.priceBase)}</p>
          <div className={styles.buyCtaPlatformRow}>
            <span className={styles.buyCtaPlatformIcon} aria-hidden>
              <GameDetailPlatformIcon platform={game.platform} size="sm" />
            </span>
            <p className="buy-cta-sub">
              <strong>{formatPlatformLabel(game.platform)}</strong>
              <span
                className={
                  mode === 'offline'
                    ? `${styles.platformAccessBadge} ${styles.platformAccessBadgeOffline} ${styles.platformAccessBadgeInline}`
                    : `${styles.platformAccessBadge} ${styles.platformAccessBadgeOnline} ${styles.platformAccessBadgeInline}`
                }
              >
                {getPlatformAccessBadgeLabel(game.platform)}
              </span>
              <span className={styles.buyCtaSubDivider}>·</span>
              {game.soldOut
                ? 'Currently unavailable for purchase'
                : 'Instant access after purchase'}
            </p>
          </div>
        </div>
        <div className="buy-cta-action">
          <GameDetailBuyButton slug={game.slug} soldOut={game.soldOut} />
        </div>
      </div>
    </div>
  );
}
