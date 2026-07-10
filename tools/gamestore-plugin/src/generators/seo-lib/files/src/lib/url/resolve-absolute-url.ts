import { siteConfig } from '../site-config';

export function resolveAbsoluteUrl(path: string, siteUrl = siteConfig.siteUrl): string {
  const trimmed = path.trim();
  if (!trimmed) {
    return siteUrl.replace(/\/$/, '');
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const base = siteUrl.replace(/\/$/, '');
  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${base}${normalizedPath}`;
}
