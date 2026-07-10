import { ApiError, getFeaturedGames } from '@gamestore/web/data-access';
import { HomeHeroShowcaseClient } from './home-hero-showcase-client';

export async function HomeHeroShowcase() {
  let games: Awaited<ReturnType<typeof getFeaturedGames>> = [];
  try {
    games = await getFeaturedGames();
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 404) {
      games = [];
    }
  }

  return <HomeHeroShowcaseClient games={games} />;
}
