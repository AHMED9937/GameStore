import type { Game } from '@gamestore/web/data-access';
import { Card, Container, Heading, Text } from '@gamestore/shared/ui';
import styles from './section.module.css';

export type GameDetailInfoProps = {
  game: Pick<Game, 'description' | 'platform'>;
};

export function GameDetailInfo({ game }: GameDetailInfoProps) {
  return (
    <section className={styles.sectionTight}>
      <Container>
        <Heading level="h2">About this game</Heading>
        <Card className={styles.panel} style={{ marginTop: '1rem' }}>
          <Text tone="muted">
            {game.description ?? 'No description available.'}
          </Text>
          <Text tone="dim" style={{ marginTop: '0.75rem' }}>
            Platform: {game.platform}
          </Text>
        </Card>
      </Container>
    </section>
  );
}
