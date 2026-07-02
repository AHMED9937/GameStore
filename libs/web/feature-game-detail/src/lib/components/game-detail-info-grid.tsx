import type { DetailIconName } from '../game-detail.constants';
import { DetailIcon } from './game-detail-icons';

export type GameDetailInfoItem = {
  title: string;
  description: string;
  icon: DetailIconName;
};

export type GameDetailInfoGridProps = {
  items: GameDetailInfoItem[];
  variant?: 'default' | 'warning';
};

export function GameDetailInfoGrid({ items, variant = 'default' }: GameDetailInfoGridProps) {
  const cardClass =
    variant === 'warning' ? 'info-card info-card--warning' : 'info-card';

  return (
    <div className="info-card-grid">
      {items.map((item) => (
        <article key={item.title} className={cardClass}>
          <div className="info-card-icon" aria-hidden>
            <DetailIcon name={item.icon} />
          </div>
          <h4 className="info-card-title">{item.title}</h4>
          <p className="info-card-text">{item.description}</p>
        </article>
      ))}
    </div>
  );
}
