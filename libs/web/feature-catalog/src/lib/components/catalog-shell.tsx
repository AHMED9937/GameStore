'use client';

import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { Game } from '@gamestore/web/data-access';
import { Container, EmptyState, Input } from '@gamestore/shared/ui';
import {
  CATALOG_HERO_DESCRIPTION,
  CATALOG_PLATFORM_FILTERS,
  type CatalogPlatformFilter,
} from '../catalog.constants';
import { filterCatalogGames } from '../catalog.utils';
import { CatalogCard } from './catalog-card';
import { CatalogHero } from './catalog-hero';
import { CatalogPlatformIcon } from './catalog-platform-icon';
import styles from './section.module.css';

export type CatalogShellProps = {
  games: Game[];
};

export function CatalogShell({ games }: CatalogShellProps) {
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<CatalogPlatformFilter>('all');

  const filteredGames = useMemo(
    () => filterCatalogGames(games, searchQuery, platformFilter),
    [games, searchQuery, platformFilter],
  );

  const hasActiveFilters = platformFilter !== 'all' || searchQuery.trim().length > 0;

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchQuery(searchInput.trim());
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearchQuery('');
    setPlatformFilter('all');
  };

  return (
    <>
      <CatalogHero />

      <section className={styles.sectionTight} aria-label="Catalog search">
        <Container>
          <form className={styles.searchRow} onSubmit={handleSearchSubmit}>
            <Input
              type="search"
              value={searchInput}
              placeholder="Search by title, genre, or platform…"
              aria-label="Search games"
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </form>
        </Container>
      </section>

      <section className={styles.sectionTight} aria-label="Platform filters">
        <Container>
          <div className={styles.filterBar} role="group" aria-label="Filter by platform">
            {CATALOG_PLATFORM_FILTERS.map((filter) => {
              const isActive = platformFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  className={[styles.filterBtn, isActive ? styles.filterBtnActive : '']
                    .filter(Boolean)
                    .join(' ')}
                  aria-pressed={isActive}
                  onClick={() => setPlatformFilter(filter.id)}
                >
                  <CatalogPlatformIcon filter={filter.id} />
                  {filter.label}
                </button>
              );
            })}
          </div>
        </Container>
      </section>

      <section
        className={styles.sectionTight}
        style={{ paddingBottom: '3rem' }}
        aria-label="Game results"
      >
        <Container>
          <p className={styles.resultsSummary}>
            {filteredGames.length} {filteredGames.length === 1 ? 'game' : 'games'}
            {hasActiveFilters ? ' matching your filters' : ' available'}
          </p>

          {!filteredGames.length ? (
            <div className={styles.emptyWrap}>
              <EmptyState
                title={games.length ? 'No matches found' : 'No games yet'}
                message={
                  games.length
                    ? 'Try a different search term or clear your platform filter.'
                    : CATALOG_HERO_DESCRIPTION
                }
              />
              {hasActiveFilters && games.length > 0 ? (
                <button
                  type="button"
                  className={styles.clearFiltersBtn}
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          ) : (
            <div className={styles.grid}>
              {filteredGames.map((game, index) => (
                <CatalogCard key={game.id} game={game} priority={index < 4} />
              ))}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
