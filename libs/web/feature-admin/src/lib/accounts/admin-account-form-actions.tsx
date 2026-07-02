import Link from 'next/link';
import { Button } from '@gamestore/shared/ui';
import styles from './accounts.module.css';

export type AdminAccountFormActionsProps = {
  cancelHref?: string;
  saving?: boolean;
  submitLabel?: string;
};

export function AdminAccountFormActions({
  cancelHref = '/admin/accounts',
  saving = false,
  submitLabel = 'Save account',
}: AdminAccountFormActionsProps) {
  return (
    <div className={styles.formActions} data-testid="admin-account-form-actions">
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
