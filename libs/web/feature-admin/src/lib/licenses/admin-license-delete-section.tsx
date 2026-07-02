import { Button, Heading, Text } from '@gamestore/shared/ui';
import styles from './licenses.module.css';

export type AdminLicenseDeleteSectionProps = {
  disabled?: boolean;
  deleting?: boolean;
  onDelete?: () => void;
};

export function AdminLicenseDeleteSection({
  disabled = false,
  deleting = false,
  onDelete,
}: AdminLicenseDeleteSectionProps) {
  return (
    <section
      className={styles.deleteSection}
      aria-labelledby="admin-license-delete-heading"
      data-testid="admin-license-delete-section"
    >
      <Heading level="h3" id="admin-license-delete-heading" style={{ marginBottom: '0.5rem' }}>
        Danger zone
      </Heading>
      <Text tone="muted" style={{ marginBottom: '0.75rem' }}>
        Permanently remove this license key. Activated licenses cannot be deleted.
      </Text>
      <Button
        type="button"
        variant="secondary"
        disabled={disabled || deleting}
        onClick={onDelete}
      >
        {deleting ? 'Deleting…' : 'Delete license'}
      </Button>
    </section>
  );
}
