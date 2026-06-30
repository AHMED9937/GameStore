import Link from 'next/link';
import { Button } from '@gamestore/shared/ui';
import styles from './games.module.css';

export type AdminGameFormActionsProps = {
  cancelHref?: string;
};

export function AdminGameFormActions({
  cancelHref = '/admin/games',
}: AdminGameFormActionsProps) {
  return (
    <div className={styles.formActions} data-testid="admin-game-form-actions">
      <Button type="submit" disabled>
        Save game
      </Button>
      <Link href={cancelHref}>
        <Button type="button" variant="secondary">
          Cancel
        </Button>
      </Link>
    </div>
  );
}
