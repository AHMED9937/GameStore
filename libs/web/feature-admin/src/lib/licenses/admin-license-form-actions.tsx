import Link from 'next/link';
import { Button } from '@gamestore/shared/ui';
import styles from './licenses.module.css';

export type AdminLicenseFormActionsProps = {
  cancelHref?: string;
  saving?: boolean;
  onGenerateKey?: () => void;
};

export function AdminLicenseFormActions({
  cancelHref = '/admin/licenses',
  saving = false,
  onGenerateKey,
}: AdminLicenseFormActionsProps) {
  return (
    <div className={styles.formActions} data-testid="admin-license-form-actions">
      <Button type="submit" disabled={saving}>
        {saving ? 'Issuing…' : 'Issue license'}
      </Button>
      <Button
        type="button"
        variant="secondary"
        disabled={saving || !onGenerateKey}
        onClick={onGenerateKey}
      >
        Generate one key
      </Button>
      <Link href={cancelHref}>
        <Button type="button" variant="ghost" disabled={saving}>
          Cancel
        </Button>
      </Link>
    </div>
  );
}
