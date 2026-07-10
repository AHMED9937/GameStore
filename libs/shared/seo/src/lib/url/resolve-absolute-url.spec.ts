import { resolveAbsoluteUrl } from './resolve-absolute-url';

describe('resolveAbsoluteUrl', () => {
  it('prefixes relative paths with site url', () => {
    expect(resolveAbsoluteUrl('/og/default.png', 'https://example.com')).toBe(
      'https://example.com/og/default.png',
    );
  });

  it('returns absolute urls unchanged', () => {
    expect(
      resolveAbsoluteUrl('https://cdn.example.com/cover.jpg', 'https://example.com'),
    ).toBe('https://cdn.example.com/cover.jpg');
  });

  it('normalizes site url trailing slash', () => {
    expect(resolveAbsoluteUrl('/shop', 'https://example.com/')).toBe(
      'https://example.com/shop',
    );
  });
});
