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
});
