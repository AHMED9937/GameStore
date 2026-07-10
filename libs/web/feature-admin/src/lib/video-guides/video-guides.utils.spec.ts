import { describe, expect, it } from 'vitest';
import { toEmbedPreviewUrl } from './video-guides.utils';

describe('toEmbedPreviewUrl', () => {
  it('returns null for empty input', () => {
    expect(toEmbedPreviewUrl('')).toBeNull();
    expect(toEmbedPreviewUrl('   ')).toBeNull();
  });

  it('normalizes embed URLs', () => {
    expect(toEmbedPreviewUrl('https://www.youtube.com/embed/abc123')).toBe(
      'https://www.youtube.com/embed/abc123',
    );
    expect(toEmbedPreviewUrl('//www.youtube.com/embed/abc123')).toBe(
      'https://www.youtube.com/embed/abc123',
    );
  });

  it('converts watch and short URLs to embed URLs', () => {
    expect(toEmbedPreviewUrl('https://www.youtube.com/watch?v=abc123')).toBe(
      'https://www.youtube.com/embed/abc123',
    );
    expect(toEmbedPreviewUrl('https://youtu.be/abc123')).toBe(
      'https://www.youtube.com/embed/abc123',
    );
  });

  it('returns other http URLs unchanged', () => {
    expect(toEmbedPreviewUrl('https://example.com/video')).toBe('https://example.com/video');
  });
});
