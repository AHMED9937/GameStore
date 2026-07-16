import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Game } from '@gamestore/web/data-access';
import { CatalogCard } from './catalog-card';

const baseGame: Game = {
  id: '1',
  slug: 'demo-game',
  title: 'Demo Game',
  description: 'A demo title',
  platform: 'steam',
  priceBase: '9.99',
  coverImage: '/cover.png',
};

describe('CatalogCard', () => {
  it('renders sold out badge when game is sold out', () => {
    render(<CatalogCard game={{ ...baseGame, soldOut: true }} />);
    expect(screen.getByText('Sold out')).toBeTruthy();
  });

  it('does not render sold out badge when game is available', () => {
    render(<CatalogCard game={{ ...baseGame, soldOut: false }} />);
    expect(screen.queryByText('Sold out')).toBeNull();
  });

  it('renders descriptive cover alt text', () => {
    const { container } = render(<CatalogCard game={baseGame} />);
    const image = container.querySelector('img');

    expect(image?.getAttribute('alt')).toBe('Demo Game cover');
  });

  it('renders SAVE badge, sale price, and top countdown', () => {
    render(
      <CatalogCard
        game={{
          ...baseGame,
          discount: {
            percentOff: 25,
            priceSale: '7.49',
            endsAt: '2099-01-01T00:00:00.000Z',
            showCountdown: true,
          },
        }}
      />,
    );

    expect(screen.getByTestId('game-discount-badge').textContent).toMatch(/Save/i);
    expect(screen.getByTestId('game-price-display').textContent).toContain('$7.49');
    expect(screen.getByTestId('game-deal-countdown').textContent).toMatch(
      /Ends in|Ending soon/i,
    );
  });
});
