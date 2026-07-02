import type { LicenseGameSummary } from '@gamestore/web/data-access';
import styles from './steam-access.module.css';

export type PurchaseGameCardProps = {
  game: Pick<LicenseGameSummary, 'title' | 'coverImage'>;
  coverFallback?: string;
};

export function PurchaseGameCard({
  game,
  coverFallback = '/og/default.png',
}: PurchaseGameCardProps) {
  const coverSrc = game.coverImage?.trim() || coverFallback;

  return (
    <aside className={styles.gameCard} data-testid="steam-game-card">
      <p className={styles.gameLabel}>Your Game</p>
      <h2 className={styles.gameTitle}>{game.title}</h2>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={styles.cover}
        src={coverSrc}
        alt={game.title}
        loading="lazy"
      />
    </aside>
  );
}
