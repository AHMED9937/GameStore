import type { GameSystemRequirements } from '@gamestore/shared/game-requirements';
import { requirementsToDisplayRows } from '@gamestore/shared/game-requirements';
import { IconCpu } from './game-detail-icons';

export type GameDetailSpecsProps = {
  minimum?: GameSystemRequirements | null;
  recommended?: GameSystemRequirements | null;
};

function SpecsPanel({
  title,
  requirements,
  recommended = false,
}: {
  title: string;
  requirements: GameSystemRequirements;
  recommended?: boolean;
}) {
  const rows = requirementsToDisplayRows(requirements);

  return (
    <article className={recommended ? 'specs-panel specs-panel--recommended' : 'specs-panel'}>
      <header className="specs-panel-header">
        <IconCpu className="meta-chip-icon" />
        <h3 className="specs-panel-title">{title}</h3>
        {recommended ? <span className="specs-panel-badge">Best</span> : null}
      </header>
      <div className="specs-rows">
        {rows.map((row) => (
          <div key={`${row.label}-${row.value}`} className="specs-row">
            <span className="specs-label">{row.label}</span>
            <span className="specs-value">{row.value}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

export function GameDetailSpecs({ minimum, recommended }: GameDetailSpecsProps) {
  if (!minimum && !recommended) {
    return (
      <p className="detail-section-lead">
        System requirements have not been published for this title yet.
      </p>
    );
  }

  return (
    <div className="specs-grid">
      {minimum ? <SpecsPanel title="Minimum" requirements={minimum} /> : null}
      {recommended ? (
        <SpecsPanel title="Recommended" requirements={recommended} recommended />
      ) : null}
    </div>
  );
}
