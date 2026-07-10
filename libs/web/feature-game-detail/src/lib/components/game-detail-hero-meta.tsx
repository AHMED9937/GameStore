import {
  formatPlatformLabel,
  formatReleaseDate,
  getPlatformAccessBadgeLabel,
  getPlatformAccessMode,
} from '../game-detail.utils';
import { IconCalendar, IconEpic, IconGamepad, IconMicrosoft, IconSteam } from './game-detail-icons';

export type GameDetailHeroMetaProps = {
  platform: string;
  releaseDate?: string | null;
  genres?: string[];
};

function PlatformIcon({ platform }: { platform: string }) {
  const className = 'meta-chip-icon meta-chip-icon--platform';

  switch (platform.toLowerCase()) {
    case 'steam':
      return <IconSteam className={className} aria-hidden />;
    case 'epic':
      return <IconEpic className={className} aria-hidden />;
    case 'microsoft':
    case 'xbox':
      return <IconMicrosoft className={className} aria-hidden />;
    default:
      return <IconGamepad className={className} aria-hidden />;
  }
}

export function GameDetailHeroMeta({
  platform,
  releaseDate,
  genres = [],
}: GameDetailHeroMetaProps) {
  const formattedRelease = releaseDate ? formatReleaseDate(releaseDate) : null;
  const accessMode = getPlatformAccessMode(platform);
  const accessLabel = getPlatformAccessBadgeLabel(platform);

  return (
    <div className="meta-chip-row" data-testid="game-detail-hero-meta">
      <span className="meta-chip meta-chip--platform">
        <PlatformIcon platform={platform} />
        <span className="meta-chip-label">Platform</span>
        <span className="meta-chip-value">{formatPlatformLabel(platform)}</span>
        <span
          className={
            accessMode === 'offline'
              ? 'meta-chip-access meta-chip-access--offline'
              : 'meta-chip-access meta-chip-access--online'
          }
        >
          {accessLabel}
        </span>
      </span>

      {formattedRelease ? (
        <span className="meta-chip">
          <IconCalendar className="meta-chip-icon" />
          <span className="meta-chip-label">Release</span>
          <span className="meta-chip-value">{formattedRelease}</span>
        </span>
      ) : null}

      {genres.length > 0 ? (
        <div className="genre-chip-row" aria-label="Genres">
          {genres.map((genre) => (
            <span key={genre} className="genre-chip">
              {genre}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
