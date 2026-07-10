import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Game } from '@gamestore/web/data-access';
import { CatalogShell } from './components/catalog-shell';
import { CatalogHero } from './components/catalog-hero';
import { CATALOG_HERO_DESCRIPTION } from './catalog.constants';

const games: Game[] = [
  {
    id: '1',
    slug: 'stellar-odyssey',
    title: 'Stellar Odyssey',
    description: 'Space adventure',
    platform: 'steam',
    priceBase: '9.99',
    coverImage: null,
  },
  {
    id: '2',
    slug: 'neon-rally',
    title: 'Neon Drift Rally',
    description: 'Racing game',
    platform: 'epic',
    priceBase: '14.99',
    coverImage: null,
  },
  {
    id: '3',
    slug: 'void-protocol',
    title: 'Void Protocol',
    description: null,
    platform: 'microsoft',
    priceBase: '19.99',
    coverImage: null,
  },
];

describe('CatalogHero', () => {
  it('renders production catalog description', () => {
    render(<CatalogHero />);
    expect(screen.getByRole('heading', { name: 'Game Catalog' })).toBeTruthy();
    expect(screen.getByText(CATALOG_HERO_DESCRIPTION)).toBeTruthy();
  });
});

describe('CatalogShell', () => {
  it('renders all games by default', () => {
    render(<CatalogShell games={games} />);
    expect(screen.getByText('3 games available')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Stellar Odyssey' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Neon Drift Rally' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Void Protocol' })).toBeTruthy();
  });

  it('Filters games by platform', () => {
    render(<CatalogShell games={games} />);

    fireEvent.click(screen.getByRole('button', { name: /Steam/i }));

    expect(screen.getByText('1 game matching your Filters')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Stellar Odyssey' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Neon Drift Rally' })).toBeNull();
  });

  it('Filters games by search query after pressing Enter', () => {
    render(<CatalogShell games={games} />);
    const searchbox = screen.getByRole('searchbox', { name: 'Search games' });

    fireEvent.change(searchbox, { target: { value: 'rally' } });
    expect(screen.getByText('3 games available')).toBeTruthy();

    fireEvent.submit(searchbox.closest('form')!);

    expect(screen.getByRole('heading', { name: 'Neon Drift Rally' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Stellar Odyssey' })).toBeNull();
  });

  it('shows empty state and clears Filters', () => {
    render(<CatalogShell games={games} />);

    fireEvent.click(screen.getByRole('button', { name: /Ubisoft/i }));
    expect(screen.getByText('No matches found')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Clear Filters' }));
    expect(screen.getByText('3 games available')).toBeTruthy();
  });
});
