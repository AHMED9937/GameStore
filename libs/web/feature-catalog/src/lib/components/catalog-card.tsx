import {
  formatGamePrice,
  getGameCardCover,
  resolveActiveGameDiscount,
  type Game,
} from '@gamestore/web/data-access';
import {
  Badge,
  Card,
  GameDealUrgency,
  GamePriceDisplay,
} from '@gamestore/shared/ui';
import Link from 'next/link';
import { normalizeCatalogPlatform } from '../catalog.utils';
import { CatalogCardPlatformIcon } from './catalog-platform-icon';
import styles from './section.module.css';

export type CatalogCardProps = {
  game: Game;
  priority?: boolean;
};

/** Longer names step down in size so the full title fits the 2-line zone. */
function titleSizeClass(title: string): string {
  if (title.length > 34) {
    return styles.cardTitleSm;
  }
  if (title.length > 20) {
    return styles.cardTitleMd;
  }
  return '';
}

/** Access mode + store in one compact label, e.g. "Offline Steam". */
function platformAccessLabel(platform: string): string {
  switch (normalizeCatalogPlatform(platform)) {
    case 'steam':
      return 'Offline Steam';
    case 'epic':
      return 'Epic Games';
    case 'microsoft':
      return 'Microsoft';
    case 'ubisoft':
      return 'Ubisoft';
    default:
      return platform;
  }
}

/**
 * Shop card: promo countdown docks ABOVE the art; the art stays clean except
 * a compact platform chip. Title, price, and the −% pill live below the image.
 */
export function CatalogCard({ game, priority = false }: CatalogCardProps) {
  const coverSrc = getGameCardCover(game);
  const discount = resolveActiveGameDiscount(game);

  return (
    <Link href={`/games/${game.slug}`} className={styles.cardLink}>
      <Card hover className={styles.shopCard}>
        {discount?.showCountdown ? (
          <div className={styles.shopDealBanner}>
            <GameDealUrgency
              variant="banner"
              endsAt={discount.endsAt}
              showCountdown
            />
          </div>
        ) : null}

        <div className={styles.shopCoverWrap}>
          <img
            src={coverSrc}
            alt={`${game.title} cover`}
            className={styles.shopCover}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
          />
          <span className={styles.shopPlatformChip}>
            <CatalogCardPlatformIcon platform={game.platform} />
            {platformAccessLabel(game.platform)}
          </span>
          {game.soldOut ? (
            <Badge className={styles.cardSoldOutBadge} variant="default">
              Sold out
            </Badge>
          ) : null}
        </div>

        <div className={styles.shopBody}>
          <h3
            className={[styles.cardTitle, titleSizeClass(game.title)]
              .filter(Boolean)
              .join(' ')}
            title={game.title}
          >
            {game.title}
          </h3>
          <GamePriceDisplay
            className={styles.cardPrice}
            size="sm"
            variant="pill"
            priceBaseLabel={formatGamePrice(game.priceBase)}
            priceSaleLabel={
              discount ? formatGamePrice(discount.priceSale) : null
            }
            percentOff={discount?.percentOff ?? null}
          />
        </div>
      </Card>
    </Link>
  );
}
