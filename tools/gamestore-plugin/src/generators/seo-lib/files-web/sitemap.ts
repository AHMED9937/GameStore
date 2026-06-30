import type { MetadataRoute } from 'next';

/** SEO setup shell — game URLs added when SEO is implemented */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:4200',
      lastModified: new Date(),
    },
  ];
}
