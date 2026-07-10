/** Hero / detail 1080p @2x retina (~3840×2160 max box). IGDB's largest cover preset. */
export const IGDB_COVER_HERO_SIZE = '1080p_2x';
/** Shop cards / grids 1080p single (sharp on retina without full 4K payload). */
export const IGDB_COVER_CARD_SIZE = '1080p';
/** Gallery screenshots screenshot_huge @2x (~2560×1440 max). IGDB's largest screenshot preset. */
export const IGDB_SCREENSHOT_SIZE = 'screenshot_huge_2x';

const IGDB_IMAGE_UPLOAD_PATTERN = /\/t_[^/]+\//;

export function normalizeIgdbImageUrl(url?: string): string {
  if (!url) {
    return '';
  }
  return url.startsWith('//') ? `https:${url}` : url;
}

export function isIgdbImageUrl(url: string): boolean {
  return IGDB_IMAGE_UPLOAD_PATTERN.test(url);
}

export function upgradeIgdbImageUrl(url: string | undefined, size: string): string {
  const normalized = normalizeIgdbImageUrl(url);
  if (!normalized || !isIgdbImageUrl(normalized)) {
    return normalized;
  }
  return normalized.replace(IGDB_IMAGE_UPLOAD_PATTERN, `/t_${size}/`);
}

export function resolveIgdbCoverUrls(rawUrl?: string): {
  coverUrl: string | null;
  coverCardUrl: string | null;
  coverSourceUrl: string | null;
} {
  const coverSourceUrl = normalizeIgdbImageUrl(rawUrl) || null;
  if (!coverSourceUrl) {
    return { coverUrl: null, coverCardUrl: null, coverSourceUrl: null };
  }

  return {
    coverUrl: upgradeIgdbImageUrl(coverSourceUrl, IGDB_COVER_HERO_SIZE) || null,
    coverCardUrl: upgradeIgdbImageUrl(coverSourceUrl, IGDB_COVER_CARD_SIZE) || null,
    coverSourceUrl,
  };
}
