import Link from 'next/link';
import { Button } from '@gamestore/shared/ui';
import { AdminPageHeader } from '../components/admin-page-header';
import styles from './accounts.module.css';

export function AdminAccountsHeader() {
  return (
    <section className={styles.pageIntro}>
      <AdminPageHeader
        title="Steam accounts"
        description="Manage the shared account pool (credentials never shown in list views)."
        actions={
          <Link href="/admin/accounts/new">
            <Button type="button">Add account</Button>
          </Link>
        }
      />
    </section>
  );
}
