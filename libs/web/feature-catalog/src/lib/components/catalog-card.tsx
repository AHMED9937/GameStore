import { formatGamePrice, type Game } from '@gamestore/web/data-access';
import { Card, Heading, Text } from '@gamestore/shared/ui';
import Link from 'next/link';
import styles from './section.module.css';

export function CatalogCard({ game }: { game: Game }) {
  return (
    <Link href={`/games/${game.slug}`} className={styles.cardLink}>
      <Card hover className={styles.panel}>
        <Heading level="h3">{game.title}</Heading>
        <Text tone="dim" style={{ marginTop: '0.5rem' }}>
          {game.platform}
        </Text>
        <Text tone="muted" style={{ marginTop: '0.5rem' }}>
          {formatGamePrice(game.priceBase)}
        </Text>
      </Card>
    </Link>
  );
}
