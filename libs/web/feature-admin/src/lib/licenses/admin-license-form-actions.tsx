import Link from 'next/link';
import { Button } from '@gamestore/shared/ui';
import styles from './licenses.module.css';

export type AdminLicenseFormActionsProps = {
  cancelHref?: string;
};

export function AdminLicenseFormActions({
  cancelHref = '/admin/licenses',
}: AdminLicenseFormActionsProps) {
  return (
    <div className={styles.formActions} data-testid="admin-license-form-actions">
      <Button type="submit" disabled>
        Issue license
      </Button>
      <Button type="button" variant="secondary" disabled>
        Generate key
      </Button>
      <Link href={cancelHref}>
        <Button type="button" variant="ghost">
          Cancel
        </Button>
      </Link>
    </div>
  );
}
