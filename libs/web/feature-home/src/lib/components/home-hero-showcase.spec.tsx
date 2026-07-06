import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
  it('renders the active game with a link to its detail page', () => {
    render(<HomeHeroShowcaseClient games={games} />);

    expect(screen.getByLabelText('Featured game showcase')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'View Neon Drift Rally' }).getAttribute('href')).toBe(
      '/games/neon-drift',
    );
    expect(screen.getByAltText('Neon Drift Rally').getAttribute('src')).toBe('/covers/neon.png');
  });

  it('navigates between games with next and thumbnail controls', () => {
    render(<HomeHeroShowcaseClient games={games} />);

    fireEvent.click(screen.getByRole('button', { name: 'Next featured game' }));
    expect(screen.getByRole('link', { name: 'View Stellar Odyssey' })).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: 'Shadow Realm' }));
    expect(screen.getByRole('link', { name: 'View Shadow Realm' })).toBeTruthy();
  });

  it('renders nothing when no games are available', () => {
    const { container } = render(<HomeHeroShowcaseClient games={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
