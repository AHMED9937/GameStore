import type { MetadataRoute } from 'next';
import { getGames } from '@gamestore/web/data-access';
import { buildSitemapEntries, siteConfig } from '@gamestore/shared/seo';

export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let games: Awaited<ReturnType<typeof getGames>> = [];

  try {
    games = await getGames();
  } catch {
    games = [];
  }

  return buildSitemapEntries({
    games,
    siteUrl: siteConfig.siteUrl,
  });
}
