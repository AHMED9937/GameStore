import { buildSitemapEntries } from './build-sitemap';

describe('buildSitemapEntries', () => {
  it('includes static routes and published game slugs', () => {
    const entries = buildSitemapEntries({
      siteUrl: 'https://store.example.com',
      games: [
        { slug: 'demo-game-1', publishedAt: '2025-01-01T00:00:00.000Z' },
        { slug: 'demo-game-2', publishedAt: '2025-02-01T00:00:00.000Z' },
      ],
    });

    const urls = entries.map((entry) => entry.url);
    expect(urls).toContain('https://store.example.com/');
    expect(urls).toContain('https://store.example.com/shop');
    expect(urls).toContain('https://store.example.com/faq');
    expect(urls).toContain('https://store.example.com/games/demo-game-1');
    expect(urls).toContain('https://store.example.com/games/demo-game-2');
  });

  it('handles large game lists quickly', () => {
    const games = Array.from({ length: 500 }, (_, index) => ({
      slug: `game-${index}`,
      publishedAt: '2025-01-01T00:00:00.000Z',
    }));

    const started = performance.now();
    const entries = buildSitemapEntries({
      siteUrl: 'https://store.example.com',
      games,
    });
    const elapsed = performance.now() - started;

    expect(entries.length).toBe(505);
    expect(elapsed).toBeLessThan(50);
  });
});
