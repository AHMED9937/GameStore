import { Button, Heading, Text } from '@gamestore/shared/ui';
import styles from './games.module.css';

export type AdminGameDeleteSectionProps = {
  disabled?: boolean;
  deleting?: boolean;
  onDelete?: () => void;
};

export function AdminGameDeleteSection({
  disabled = true,
  deleting = false,
  onDelete,
}: AdminGameDeleteSectionProps) {
  return (
    <section
      className={styles.deleteSection}
      aria-labelledby="admin-game-delete-heading"
      data-testid="admin-game-delete-section"
    >
      <Heading level="h3" id="admin-game-delete-heading" style={{ marginBottom: '0.5rem' }}>
        Danger zone
      </Heading>
      <Text tone="muted" style={{ marginBottom: '0.75rem' }}>
        Permanently remove this game from the catalog. This action cannot be undone.
      </Text>
      <Button
        type="button"
        variant="secondary"
        disabled={disabled || deleting}
        onClick={onDelete}
      >
        {deleting ? 'Deleting…' : 'Delete game'}
      </Button>
    </section>
  );
}
