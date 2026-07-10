import { ApiError, getGames } from '@gamestore/web/data-access';
import { CatalogShell } from './components/catalog-shell';

export async function CatalogPage() {
  let games: Awaited<ReturnType<typeof getGames>> = [];

  try {
    games = await getGames();
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 404) {
      games = [];
    }
  }

  return <CatalogShell games={games} />;
}
