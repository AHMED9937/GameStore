import { ApiError, getGames } from '@gamestore/web/data-access';
import { Card, Container, EmptyState, Heading } from '@gamestore/shared/ui';
import styles from './section.module.css';

export async function HomeFeaturedGrid() {
  let games: Awaited<ReturnType<typeof getGames>> = [];
  try {
    games = await getGames();
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 404) {
      games = [];
    }
  }

  return (
    <section className={styles.sectionTight}>
      <Container>
        <Heading level="h2">Featured Games</Heading>
        {!games.length ? (
          <div style={{ marginTop: '1.5rem' }}>
            <EmptyState title="No games yet" message="Featured titles will appear here." />
          </div>
        ) : (
          <div className={styles.grid}>
            {games.map((game) => (
              <Card key={game.id} hover className={styles.panel}>
                <Heading level="h3">{game.title}</Heading>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
