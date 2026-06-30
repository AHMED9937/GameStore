import { ApiError, getGames } from '@gamestore/web/data-access';
import { Container, EmptyState, Text } from '@gamestore/shared/ui';
import { CatalogCard } from './catalog-card';
import styles from './section.module.css';

export async function CatalogGrid() {
  let games: Awaited<ReturnType<typeof getGames>> = [];
  try {
    games = await getGames();
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 404) {
      games = [];
    }
  }

  return (
    <section className={styles.sectionTight} style={{ paddingBottom: '3rem' }}>
      <Container>
        <Text tone="dim">CatalogGrid</Text>
        {!games.length ? (
          <div style={{ marginTop: '1.5rem' }}>
            <EmptyState title="No games yet" message="The catalog is empty until games are added." />
          </div>
        ) : (
          <div className={styles.grid}>
            {games.map((game) => (
              <CatalogCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
