'use client';

import { useEffect, useState } from 'react';
import { getAdminGames, isSetupResponse } from '@gamestore/web/data-access';
import styles from './accounts.module.css';

export type AdminAccountsGameFilterProps = {
  gameId: string;
  disabled?: boolean;
  onGameIdChange: (gameId: string) => void;
};

export function AdminAccountsGameFilter({
  gameId,
  disabled = false,
  onGameIdChange,
}: AdminAccountsGameFilterProps) {
  const [games, setGames] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    if (disabled) {
      return;
    }
    void getAdminGames().then((result) => {
      if (isSetupResponse(result) || !Array.isArray(result)) {
        return;
      }
      setGames(result.map((game) => ({ id: game.id, title: game.title })));
    });
  }, [disabled]);

  return (
    <div className={styles.gameFilter} data-testid="admin-accounts-game-filter">
      <select
        className={styles.filterSelect}
        value={gameId}
        disabled={disabled}
        aria-label="Filter accounts by game"
        onChange={(event) => onGameIdChange(event.target.value)}
      >
        <option value="">All games</option>
        {games.map((game) => (
          <option key={game.id} value={game.id}>
            {game.title}
          </option>
        ))}
      </select>
    </div>
  );
}
