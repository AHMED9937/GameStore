export * from './lib/igdb.service';
export * from './lib/igdb.module';
export { IgdbConfig } from './lib/igdb.config';
export {
  IGDB_COVER_CARD_SIZE,
  IGDB_COVER_HERO_SIZE,
  IGDB_SCREENSHOT_SIZE,
  normalizeIgdbImageUrl,
  resolveIgdbCoverUrls,
  upgradeIgdbImageUrl,
} from './lib/igdb-image-url';
export { IgdbClient, IgdbClientError, setIgdbFetchForTests, resetIgdbFetchForTests } from './lib/igdb-client';
export { importIgdbGame } from './lib/igdb-import.core';
export { IGDB_API_PAGE_SIZE } from './lib/igdb-media.constants';
export type { GameMediaType } from './lib/igdb-media.constants';
export type {
  IgdbGameDetails,
  IgdbImportInput,
  IgdbImportedGame,
  IgdbScreenshot,
  IgdbSearchResult,
  IgdbVideo,
} from './lib/igdb.types';
