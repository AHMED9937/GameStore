import { Button, Heading, Text } from '@gamestore/shared/ui';
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
      className={styles.deleteSection}
      aria-labelledby="admin-account-delete-heading"
      data-testid="admin-account-delete-section"
    >
      <Heading level="h3" id="admin-account-delete-heading" style={{ marginBottom: '0.5rem' }}>
        Danger zone
      </Heading>
      <Text tone="muted" style={{ marginBottom: '0.75rem' }}>
        Permanently remove this pool account. Only allowed when no licenses are assigned.
      </Text>
      <Button
        type="button"
        variant="secondary"
        disabled={disabled || deleting}
        onClick={onDelete}
      >
        {deleting ? 'Deleting…' : 'Delete account'}
      </Button>
    </section>
  );
}
