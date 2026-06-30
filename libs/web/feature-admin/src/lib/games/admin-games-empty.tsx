import { EmptyState } from '@gamestore/shared/ui';

export function AdminGamesEmpty() {
  return (
    <div data-testid="admin-games-empty">
      <EmptyState message="No games in catalog yet." />
    </div>
  );
}
