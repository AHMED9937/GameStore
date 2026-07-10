import { formatGamePrice, getGameCardCover, type Game } from '@gamestore/web/data-access';
import { Badge, Card, Heading, Text } from '@gamestore/shared/ui';
import Link from 'next/link';
import { normalizeCatalogPlatform } from '../catalog.utils';
import { CatalogCardPlatformIcon } from './catalog-platform-icon';
import styles from './section.module.css';

function formatPlatformLabel(platform: string): string {
  switch (normalizeCatalogPlatform(platform)) {
    case 'steam':
      return 'Steam';
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

export type CatalogCardProps = {
  game: Game;
  priority?: boolean;
};

export function CatalogCard({ game, priority = false }: CatalogCardProps) {
  const coverSrc = getGameCardCover(game);

  return (
    <Link href={`/games/${game.slug}`} className={styles.cardLink}>
      <Card hover className={styles.panel}>
        <div className={styles.cardCoverWrap}>
          <img
            src={coverSrc}
            alt={`${game.title} cover`}
            className={styles.cardCover}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
          />
          {game.soldOut ? (
            <Badge className={styles.cardSoldOutBadge} variant="default">
              Sold out
            </Badge>
          ) : null}
        </div>
        <Heading level="h3" className={styles.cardTitle}>
          {game.title}
        </Heading>
        <div className={styles.cardPlatformRow}>
          <CatalogCardPlatformIcon platform={game.platform} />
          <Text tone="dim">{formatPlatformLabel(game.platform)}</Text>
        </div>
        <Text tone="muted" className={styles.cardPrice}>
          {formatGamePrice(game.priceBase)}
        </Text>
      </Card>
    </Link>
  );
}
