import { formatReleaseDate } from '../game-detail.utils';

export type GameDetailDescriptionPanelProps = {
  description?: string | null;
  genres?: string[];
  releaseDate?: string | null;
};

export function GameDetailDescriptionPanel({
  description,
  genres = [],
  releaseDate,
}: GameDetailDescriptionPanelProps) {
  const paragraphs = (description ?? 'No game description has been added yet.')
    .split('\n\n')
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <>
      <div className="prose-readable">
        {paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 48)}>{paragraph}</p>
        ))}
      </div>

      {genres.length > 0 || releaseDate ? (
        <div className="prose-meta-row">
          {genres.length > 0 ? (
            <div className="genre-chip-row" aria-label="Genres">
              {genres.map((genre) => (
                <span key={genre} className="genre-chip">
                  {genre}
                </span>
              ))}
            </div>
          ) : null}
          {releaseDate ? (
            <span className="meta-chip">
              <span className="meta-chip-label">Release</span>
              <span className="meta-chip-value">{formatReleaseDate(releaseDate)}</span>
            </span>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
