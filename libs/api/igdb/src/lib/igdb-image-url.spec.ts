import { describe, expect, it } from 'vitest';
import {
  IGDB_COVER_CARD_SIZE,
  IGDB_COVER_HERO_SIZE,
  IGDB_SCREENSHOT_SIZE,
  normalizeIgdbImageUrl,
  resolveIgdbCoverUrls,
  upgradeIgdbImageUrl,
} from './igdb-image-url';

describe('igdb-image-url', () => {
  const thumbUrl = '//images.igdb.com/igdb/image/upload/t_thumb/co1.jpg';

  it('normalizes protocol-relative URLs', () => {
    expect(normalizeIgdbImageUrl(thumbUrl)).toBe(
      'https://images.igdb.com/igdb/image/upload/t_thumb/co1.jpg',
    );
  });

  it('upgrades thumb to hero and card sizes', () => {
    expect(upgradeIgdbImageUrl(thumbUrl, IGDB_COVER_HERO_SIZE)).toBe(
      'https://images.igdb.com/igdb/image/upload/t_1080p_2x/co1.jpg',
    );
    expect(upgradeIgdbImageUrl(thumbUrl, IGDB_COVER_CARD_SIZE)).toBe(
      'https://images.igdb.com/igdb/image/upload/t_1080p/co1.jpg',
    );
    expect(upgradeIgdbImageUrl(thumbUrl, IGDB_SCREENSHOT_SIZE)).toBe(
      'https://images.igdb.com/igdb/image/upload/t_screenshot_huge_2x/co1.jpg',
    );
  });

  it('is idempotent when size already matches', () => {
    const heroUrl = 'https://images.igdb.com/igdb/image/upload/t_1080p_2x/co1.jpg';
    expect(upgradeIgdbImageUrl(heroUrl, IGDB_COVER_HERO_SIZE)).toBe(heroUrl);
  });

  it('passes through non-IGDB URLs', () => {
    expect(upgradeIgdbImageUrl('/og/default.png', IGDB_COVER_HERO_SIZE)).toBe(
      '/og/default.png',
    );
  });

  it('resolveIgdbCoverUrls returns hero, card, and raw source', () => {
    expect(resolveIgdbCoverUrls(thumbUrl)).toEqual({
      coverUrl: 'https://images.igdb.com/igdb/image/upload/t_1080p_2x/co1.jpg',
      coverCardUrl: 'https://images.igdb.com/igdb/image/upload/t_1080p/co1.jpg',
      coverSourceUrl: 'https://images.igdb.com/igdb/image/upload/t_thumb/co1.jpg',
    });
  });
});
