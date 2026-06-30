import type { Game } from '@gamestore/web/data-access';
import { formatGamePrice } from '@gamestore/web/data-access';
import { Card, Container, Heading, Text } from '@gamestore/shared/ui';
import styles from './section.module.css';

export type GameDetailBuyPanelProps = {
  game: Pick<Game, 'title' | 'priceBase'>;
};

export function GameDetailBuyPanel({ game }: GameDetailBuyPanelProps) {
  return (
    <section className={styles.sectionTight}>
      <Container>
        <Heading level="h2">Buy {game.title}</Heading>
        <Card className={styles.panel} style={{ marginTop: '1rem' }}>
          <Text tone="muted">
            {formatGamePrice(game.priceBase)} — checkout wired in a later phase.
          </Text>
        </Card>
      </Container>
    </section>
  );
}
