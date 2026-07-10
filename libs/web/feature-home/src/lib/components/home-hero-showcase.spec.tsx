import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { HomeHeroShowcaseClient } from './home-hero-showcase-client';

const games = [
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
  {
    id: '2',
    slug: 'stellar-odyssey',
    title: 'Stellar Odyssey',
    description: null,
    platform: 'steam',
    priceBase: '29.99',
    coverImage: '/covers/stellar.png',
    coverCardImage: null,
  },
  {
    id: '3',
    slug: 'shadow-realm',
    title: 'Shadow Realm',
    description: null,
    platform: 'steam',
    priceBase: '24.99',
    coverImage: '/covers/shadow.png',
    coverCardImage: null,
  },
];

describe('HomeHeroShowcaseClient', () => {
  const OriginalImage = globalThis.Image;

  beforeAll(() => {
    class MockImage {
      onload: null | (() => void) = null;
      onerror: null | (() => void) = null;

      set src(_: string) {
        queueMicrotask(() => {
          this.onload?.();
        });
      }
    }

    // @ts-expect-error test image preload mock
    globalThis.Image = MockImage;
  });

  afterAll(() => {
    globalThis.Image = OriginalImage;
  });

  it('renders the active game with a link to its detail page', async () => {
    render(<HomeHeroShowcaseClient games={games} />);

    expect(screen.getByTestId('home-hero-showcase-skeleton')).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByLabelText('Featured game showcase')).toBeTruthy();
    });
    expect(screen.getByRole('link', { name: 'View Neon Drift Rally' }).getAttribute('href')).toBe('/games/neon-drift');
    expect(screen.getByAltText('Neon Drift Rally').getAttribute('src')).toBe('/covers/neon.png');
  });

  it('navigates between games with next and thumbnail controls', async () => {
    render(<HomeHeroShowcaseClient games={games} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Next featured game' })).toBeTruthy();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Next featured game' }));
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'View Stellar Odyssey' })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('tab', { name: 'Shadow Realm' }));
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'View Shadow Realm' })).toBeTruthy();
    });
  });

  it('renders nothing when no games are available', () => {
    const { container } = render(<HomeHeroShowcaseClient games={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
