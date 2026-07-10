import {
  SEO_PAGE_DEFINITIONS,
  type SeoPageId,
} from '../metadata/page-metadata.constants';
import type { SeoSitemapGameInput } from '../metadata/seo-game.types';
import { resolveAbsoluteUrl } from '../url/resolve-absolute-url';

export type SitemapEntry = {
  url: string;
  lastModified?: Date;
};

export type BuildSitemapEntriesInput = {
  games: SeoSitemapGameInput[];
  siteUrl?: string;
};

const STATIC_PAGE_IDS: SeoPageId[] = [
  'home',
  'shop',
  'faq',
  'contact',
  'subscriptions',
];

export function buildSitemapEntries(
  input: BuildSitemapEntriesInput,
): SitemapEntry[] {
  const siteUrl = input.siteUrl;
  const now = new Date();

  const staticEntries = STATIC_PAGE_IDS.map((pageId) => ({
    url: resolveAbsoluteUrl(SEO_PAGE_DEFINITIONS[pageId].path, siteUrl),
    lastModified: now,
  }));

  const gameEntries = input.games.map((game) => ({
    url: resolveAbsoluteUrl(`/games/${game.slug}`, siteUrl),
    lastModified: game.publishedAt ? new Date(game.publishedAt) : now,
  }));

  return [...staticEntries, ...gameEntries];
}
