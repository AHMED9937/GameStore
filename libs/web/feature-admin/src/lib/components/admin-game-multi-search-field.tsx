'use client';

import { useMemo, useState } from 'react';
import { Input, Text } from '@gamestore/shared/ui';
import {
  matchesGameSearch,
  useAdminGamesOptions,
  type AdminGamesFilter,
} from '../hooks/use-admin-games-options';
import pickerStyles from '../subscriptions/subscriptions.module.css';

export type AdminGameMultiSearchFieldProps = {
  value: string[];
  onChange: (gameIds: string[]) => void;
  disabled?: boolean;
  gameFilter?: AdminGamesFilter;
  ariaLabel?: string;
  testId?: string;
};

export function AdminGameMultiSearchField({
  value,
  onChange,
  disabled = false,
  gameFilter = 'published',
  ariaLabel = 'Search games in plan',
  testId = 'admin-game-multi-search-field',
}: AdminGameMultiSearchFieldProps) {
  const [query, setQuery] = useState('');
  const { games, loading } = useAdminGamesOptions(gameFilter, !disabled);

  const visibleGames = useMemo(
    () => games.filter((game) => matchesGameSearch(game, query)),
    [games, query],
  );

  const toggleGame = (gameId: string) => {
    const nextIds = value.includes(gameId)
      ? value.filter((id) => id !== gameId)
      : [...value, gameId];
    onChange(nextIds);
  };

  return (
    <div className={pickerStyles.gameSearchSection} data-testid={testId}>
      <Input
        type="search"
        aria-label={ariaLabel}
        placeholder="Search games by title or slug…"
        value={query}
        disabled={disabled}
        autoComplete="off"
        onChange={(event) => setQuery(event.target.value)}
      />
      <div
        className={pickerStyles.gamePicker}
        data-testid="admin-subscription-plan-games"
      >
        {loading ? (
          <Text tone="dim">Loading games…</Text>
        ) : visibleGames.length === 0 ? (
          <Text tone="dim">No games match your search.</Text>
        ) : (
          visibleGames.map((game) => (
            <label key={game.id} className={pickerStyles.gameOption}>
              <input
                type="checkbox"
                checked={value.includes(game.id)}
                disabled={disabled}
                onChange={() => toggleGame(game.id)}
              />
              <span>
                {game.title} <Text tone="dim">({game.slug})</Text>
              </span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}
