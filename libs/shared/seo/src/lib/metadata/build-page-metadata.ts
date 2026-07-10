import type { Metadata } from 'next';
import { siteConfig } from '../site-config';
import {
  SEO_PAGE_DEFINITIONS,
  type SeoPageId,
} from './page-metadata.constants';
import { resolveAbsoluteUrl } from '../url/resolve-absolute-url';

function withSiteName(title: string): string {
  return `${title} | ${siteConfig.siteName}`;
}

function buildOpenGraph(
  title: string,
  description: string,
  path: string,
): Metadata['openGraph'] {
  return {
    title,
    description,
    url: resolveAbsoluteUrl(path),
    siteName: siteConfig.siteName,
    images: [
      {
        url: resolveAbsoluteUrl(siteConfig.defaultOgImage),
        alt: siteConfig.siteName,
      },
    ],
    type: 'website',
  };
}

export function buildPageMetadata(pageId: SeoPageId): Metadata {
  const page = SEO_PAGE_DEFINITIONS[pageId];
  const title = withSiteName(page.title);
  const description = page.description;

  return {
    title,
    description,
    alternates: {
      canonical: resolveAbsoluteUrl(page.path),
    },
    openGraph: buildOpenGraph(page.title, description, page.path),
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [resolveAbsoluteUrl(siteConfig.defaultOgImage)],
    },
  };
}
