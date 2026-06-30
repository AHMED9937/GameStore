import Link from 'next/link';
import { Button } from '@gamestore/shared/ui';
import { AdminPageHeader } from '../components/admin-page-header';

export function AdminLicensesHeader() {
  return (
    <AdminPageHeader
      title="Licenses"
      description="Issue keys, revoke access, and inspect ownership."
      actions={
        <Link href="/admin/licenses/new">
          <Button type="button">Issue license</Button>
        </Link>
      }
    />
  );
}
