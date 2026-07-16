export type SeoGameInput = {
  slug: string;
  title: string;
  description?: string | null;
  platform: string;
  priceBase: string;
  /** When set (active sale), used as the Schema.org Offer price customers pay. */
  priceOffer?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImage?: string | null;
  coverImage?: string | null;
  soldOut?: boolean;
};

export type SeoSitemapGameInput = {
  slug: string;
  publishedAt?: string | null;
};

export type DefaultGameSeoFieldsInput = {
  title: string;
  platform: string;
  priceBase: number | string;
  summary?: string | null;
  coverImage?: string | null;
};

export type DefaultGameSeoFields = {
  metaTitle: string;
  metaDescription: string;
  ogImage: string | null;
};
