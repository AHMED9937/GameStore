import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HomeHeroShowcase } from './home-hero-showcase';

vi.mock('@gamestore/web/data-access', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@gamestore/web/data-access')>();
  return {
    ...actual,
    getFeaturedGames: vi.fn(),
  };
});

vi.mock('./home-hero-showcase-client', () => ({
  HomeHeroShowcaseClient: ({ games }: { games: unknown[] }) =>
    games.length > 0 ? <div data-testid="showcase-client">{games.length} games</div> : null,
}));

const { getFeaturedGames } = await import('@gamestore/web/data-access');

describe('HomeHeroShowcase', () => {
  it('passes featured games to the client showcase', async () => {
    vi.mocked(getFeaturedGames).mockResolvedValue([
      {
        id: '1',
        slug: 'neon-drift',
        title: 'Neon Drift Rally',
        description: null,
        platform: 'steam',
        priceBase: '19.99',
        coverImage: '/covers/neon.png',
        coverCardImage: null,
      },
    ]);

    render(await HomeHeroShowcase());

    expect(screen.getByTestId('showcase-client').textContent).toBe('1 games');
  });

  it('renders nothing when no featured games are available', async () => {
    vi.mocked(getFeaturedGames).mockResolvedValue([]);

    const { container } = render(await HomeHeroShowcase());

    expect(container.firstChild).toBeNull();
  });
});
