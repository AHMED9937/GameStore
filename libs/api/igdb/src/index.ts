export * from './lib/igdb.service';
export * from './lib/igdb.module';
export { IgdbConfig } from './lib/igdb.config';
export { IgdbClient, setIgdbFetchForTests, resetIgdbFetchForTests } from './lib/igdb-client';
export { importIgdbGame } from './lib/igdb-import.core';
export {
  IGDB_IMPORT_SCREENSHOT_LIMIT,
  IGDB_IMPORT_VIDEO_LIMIT,
} from './lib/igdb-media.constants';
export type { GameMediaType } from './lib/igdb-media.constants';
export type {
  IgdbGameDetails,
  IgdbImportInput,
  IgdbImportedGame,
  IgdbScreenshot,
  IgdbSearchResult,
  IgdbVideo,
} from './lib/igdb.types';
