export const siteConfig = {
  siteName: process.env['NEXT_PUBLIC_SITE_NAME'] ?? 'GameStore',
  siteUrl: process.env['NEXT_PUBLIC_SITE_URL'] ?? 'http://localhost:4200',
  defaultOgImage:
    process.env['NEXT_PUBLIC_DEFAULT_OG_IMAGE'] ?? '/og/default.png',
};
