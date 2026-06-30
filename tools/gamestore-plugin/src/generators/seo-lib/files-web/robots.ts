import type { MetadataRoute } from 'next';

/** SEO setup shell — full rules implemented later */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:4200'}/sitemap.xml`,
  };
}
