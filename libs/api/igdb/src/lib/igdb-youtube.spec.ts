import { describe, expect, it } from 'vitest';
import {
  extractYoutubeVideoId,
  toYoutubeEmbedFromIgdbVideoId,
} from './igdb-youtube';

describe('igdb-youtube', () => {
  it('builds embed URLs from bare YouTube ids', () => {
    expect(toYoutubeEmbedFromIgdbVideoId('abc123XYZ12')).toBe(
      'https://www.youtube.com/embed/abc123XYZ12',
    );
  });

  it('extracts ids from watch and youtu.be URLs', () => {
    expect(toYoutubeEmbedFromIgdbVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
    );
    expect(toYoutubeEmbedFromIgdbVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
    );
  });

  it('extracts embed keys for deduplication', () => {
    expect(extractYoutubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(
      'dQw4w9WgXcQ',
    );
  });
});
