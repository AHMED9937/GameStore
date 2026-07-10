import type { MetadataRoute } from 'next';
import { siteConfig } from '@gamestore/shared/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/checkout',
        '/account',
        '/my-games',
        '/auth',
        '/dev',
        '/sign-in',
        '/sign-up',
      ],
    },
    sitemap: `${siteConfig.siteUrl.replace(/\/$/, '')}/sitemap.xml`,
  };
}
