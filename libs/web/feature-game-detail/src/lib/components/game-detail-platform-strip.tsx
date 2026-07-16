import {
  formatPlatformLabel,
  getPlatformAccessBadgeLabel,
  getPlatformAccessMode,
} from '../game-detail.utils';
import { GameDetailPlatformIcon } from './game-detail-platform-icon';
import styles from './game-detail.module.css';

export type GameDetailPlatformStripProps = {
  platform: string;
  compact?: boolean;
};

export function GameDetailPlatformStrip({
  platform,
  compact = false,
}: GameDetailPlatformStripProps) {
  const mode = getPlatformAccessMode(platform);

  return (
    <div
      className={[
        styles.platformStrip,
        compact ? styles.platformStripCompact : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid="game-detail-platform-strip"
    >
      <div className={styles.platformStripIconWrap} aria-hidden>
        <GameDetailPlatformIcon platform={platform} size="sm" />
      </div>
      <div className={styles.platformStripText}>
        <span className={styles.platformStripLabel}>
          {formatPlatformLabel(platform)}
        </span>
        <span
          className={
            mode === 'offline'
              ? `${styles.platformAccessBadge} ${styles.platformAccessBadgeOffline} ${styles.platformAccessBadgeCompact}`
              : `${styles.platformAccessBadge} ${styles.platformAccessBadgeOnline} ${styles.platformAccessBadgeCompact}`
          }
        >
          {getPlatformAccessBadgeLabel(platform)}
        </span>
      </div>
    </div>
  );
}
