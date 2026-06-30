import type { Metadata } from 'next';

/** TODO(implement-seo): dynamic game metadata from API */
export function buildGameMetadata(_slug: string): Metadata {
  return {
    title: 'GameStore',
    description: 'SEO setup — not implemented yet',
  };
}
