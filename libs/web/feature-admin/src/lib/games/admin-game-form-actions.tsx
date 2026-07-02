import Link from 'next/link';
import { Button } from '@gamestore/shared/ui';
import styles from './games.module.css';

export type AdminGameFormActionsProps = {
  cancelHref?: string;
  saving?: boolean;
  submitLabel?: string;
};

export function AdminGameFormActions({
  cancelHref = '/admin/games',
  saving = false,
  submitLabel = 'Save game',
}: AdminGameFormActionsProps) {
  return (
    <div className={styles.formActions} data-testid="admin-game-form-actions">
      <Button type="submit" disabled={saving}>
        {saving ? 'Saving…' : submitLabel}
      </Button>
      <Link href={cancelHref}>
        <Button type="button" variant="secondary" disabled={saving}>
          Cancel
        </Button>
      </Link>
    </div>
  );
}
