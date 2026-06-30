import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CatalogHero } from './components/catalog-hero';

vi.mock('@gamestore/web/data-access', () => ({
  getGames: vi.fn().mockResolvedValue([]),
  formatGamePrice: (price: string) => `$${price}`,
  ApiError: class ApiError extends Error {
    status = 404;
  },
}));

import { getGames } from '@gamestore/web/data-access';
import { CatalogGrid } from './components/catalog-grid';

const mockGame = {
  id: '1',
  slug: 'demo-game-1',
  title: 'Stellar Odyssey',
  description: 'Demo description',
  platform: 'steam',
  priceBase: '9.99',
  coverImage: '/og/default.png',
};

describe('CatalogHero', () => {
  it('renders catalog heading', () => {
    render(<CatalogHero />);
    expect(screen.getByRole('heading', { name: 'Game Catalog' })).toBeTruthy();
  });
});

describe('CatalogGrid', () => {
  it('shows empty state when API returns no games', async () => {
    vi.mocked(getGames).mockResolvedValueOnce([]);
    const ui = await CatalogGrid();
    render(ui);
    expect(screen.getByText(/No games yet/i)).toBeTruthy();
  });

  it('renders game titles when API returns games', async () => {
    vi.mocked(getGames).mockResolvedValueOnce([mockGame]);
    const ui = await CatalogGrid();
    render(ui);
    expect(screen.getByRole('heading', { name: 'Stellar Odyssey' })).toBeTruthy();
    expect(screen.getByText('steam')).toBeTruthy();
  });
});
