import { ApiError, getGameBySlug } from '@gamestore/web/data-access';
import { Card, Container, EmptyState, Heading, Text } from '@gamestore/shared/ui';
import { GameDetailBuyPanel } from './components/game-detail-buy-panel';
import { GameDetailInfo } from './components/game-detail-info';
import { GameDetailRequirements } from './components/game-detail-requirements';
import styles from './components/section.module.css';

export type GameDetailPageProps = {
  slug: string;
};

export async function GameDetailPage({ slug }: GameDetailPageProps) {
  let game: Awaited<ReturnType<typeof getGameBySlug>> | null = null;
  try {
    game = await getGameBySlug(slug);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 404) {
      game = null;
    }
  }

  if (!game) {
    return (
      <section className={styles.section}>
        <Container>
          <EmptyState
            title="Game not found"
            message={`No game exists for slug "${slug}" yet.`}
          />
        </Container>
      </section>
    );
  }

  return (
    <>
      <section className={styles.section}>
        <Container>
          {game.coverImage ? (
            <img
              src={game.coverImage}
              alt=""
              className={styles.cover}
            />
          ) : null}
          <Heading level="h1">{game.title}</Heading>
          <Card className={styles.panel} style={{ marginTop: '1.5rem' }}>
            <Text tone="dim">{game.platform}</Text>
            <Text tone="muted" style={{ marginTop: '0.5rem' }}>
              {game.slug}
            </Text>
          </Card>
        </Container>
      </section>
      <GameDetailInfo game={game} />
      <GameDetailBuyPanel game={game} />
      <GameDetailRequirements />
    </>
  );
}
