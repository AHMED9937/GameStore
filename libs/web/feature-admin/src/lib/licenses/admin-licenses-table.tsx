import { Badge, Button } from '@gamestore/shared/ui';
import { AdminTable } from '../components/admin-table';
import type { AdminLicenseListItem } from './admin-licenses.types';
import { ADMIN_LICENSE_COLUMNS } from './licenses.constants';

export type AdminLicensesTableProps = {
  licenses: AdminLicenseListItem[];
};

function statusVariant(status: string): 'default' | 'accent' | 'success' {
  if (status === 'active' || status === 'assigned') {
    return 'success';
  }
  if (status === 'revoked') {
    return 'accent';
  }
  return 'default';
}

export function AdminLicensesTable({ licenses }: AdminLicensesTableProps) {
  return (
    <div data-testid="admin-licenses-table">
      <AdminTable columns={[...ADMIN_LICENSE_COLUMNS]} caption="Admin licenses">
        {licenses.map((license) => (
          <tr key={license.id}>
            <td>
              <code>{license.licenseKeyMasked}</code>
            </td>
            <td>{license.gameTitle}</td>
            <td>{license.ownerEmail ?? '—'}</td>
            <td>
              <Badge variant={statusVariant(license.status)}>{license.status}</Badge>
            </td>
            <td>
              <Button type="button" variant="secondary" disabled>
                Revoke
              </Button>
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
