import { Button, Text } from '@gamestore/shared/ui';
import styles from './accounts.module.css';

export type AdminAccountDeleteSectionProps = {
  disabled?: boolean;
  deleting?: boolean;
  onDelete?: () => void;
};

export function AdminAccountDeleteSection({
  disabled = false,
  deleting = false,
  onDelete,
}: AdminAccountDeleteSectionProps) {
  return (
    <section
      className={styles.dangerPanel}
      aria-labelledby="admin-account-delete-heading"
      data-testid="admin-account-delete-section"
    >
      <div className={styles.actionPanelHeader}>
        <Text id="admin-account-delete-heading">Danger zone</Text>
        <Text tone="dim">
          Permanently remove this pool account. Only allowed when no seats are
          occupied.
        </Text>
      </div>
      <div className={styles.actionPanelActions}>
        <Button
          type="button"
          variant="secondary"
          disabled={disabled || deleting}
          onClick={onDelete}
        >
          {deleting ? 'Deleting…' : 'Delete account'}
        </Button>
      </div>
    </section>
  );
}
