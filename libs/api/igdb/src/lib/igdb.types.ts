export type IgdbSearchResult = {
  igdbId: number;
  title: string;
  releaseDate: string | null;
  coverUrl: string | null;
};

export type IgdbGameDetails = {
  igdbId: number;
  title: string;
  summary: string | null;
  releaseDate: Date | null;
  genres: string[];
  coverUrl: string | null;
};

export type IgdbScreenshot = {
  igdbId: number | null;
  url: string;
};

export type IgdbVideo = {
  igdbId: number | null;
  title: string | null;
  url: string;
};

export type IgdbImportInput = {
  igdbId: number;
  priceBase: number | string;
  platform: string;
  slug?: string;
};

export type IgdbImportedGame = {
  id: string;
  slug: string;
  title: string;
  igdbId: number;
  platform: string;
  priceBase: string;
  publishedAt: string | null;
};
