import { formatPlatformLabel, formatReleaseDate } from '../game-detail.utils';
import { IconCalendar, IconEpic, IconMicrosoft, IconSteam } from './game-detail-icons';

export type GameDetailHeroMetaProps = {
  platform: string;
  releaseDate?: string | null;
  genres?: string[];
};

function PlatformIcon({ platform }: { platform: string }) {
  switch (platform.toLowerCase()) {
    case 'steam':
      return <IconSteam className="meta-chip-icon meta-chip-icon--platform" />;
    case 'epic':
      return <IconEpic className="meta-chip-icon meta-chip-icon--platform" />;
    case 'microsoft':
    case 'xbox':
      return <IconMicrosoft className="meta-chip-icon meta-chip-icon--platform" />;
    default:
      return null;
  }
}

export function GameDetailHeroMeta({
  platform,
  releaseDate,
  genres = [],
}: GameDetailHeroMetaProps) {
  const platformLabel = formatPlatformLabel(platform);
  const formattedRelease = releaseDate ? formatReleaseDate(releaseDate) : null;

  return (
    <div className="meta-chip-row" data-testid="game-detail-hero-meta">
      <span className="meta-chip meta-chip--platform">
        <PlatformIcon platform={platform} />
        <span className="meta-chip-value">{platformLabel}</span>
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
