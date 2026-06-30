import Link from 'next/link';
import { Button } from '@gamestore/shared/ui';
import styles from './accounts.module.css';

export type AdminAccountFormActionsProps = {
  cancelHref?: string;
};

export function AdminAccountFormActions({
  cancelHref = '/admin/accounts',
}: AdminAccountFormActionsProps) {
  return (
    <div className={styles.formActions} data-testid="admin-account-form-actions">
      <Button type="submit" disabled>
        Save account
      </Button>
      <Link href={cancelHref}>
        <Button type="button" variant="secondary">
          Cancel
        </Button>
      </Link>
    </div>
  );
}
