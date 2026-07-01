import { Badge, Button } from '@gamestore/shared/ui';
import { AdminTable } from '../components/admin-table';
import type { AdminLicenseListItem } from './admin-licenses.types';
import { ADMIN_LICENSE_COLUMNS } from './licenses.constants';

export type AdminLicensesTableProps = {
  licenses: AdminLicenseListItem[];
  revokingId?: string | null;
  onRevoke?: (licenseId: string) => void;
};

function statusVariant(
  status: string,
): 'default' | 'accent' | 'success' {
  if (status === 'available' || status === 'activated') {
    return 'success';
  }
  if (status === 'revoked') {
    return 'accent';
  }
  return 'default';
}

export function AdminLicensesTable({
  licenses,
  revokingId = null,
  onRevoke,
}: AdminLicensesTableProps) {
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
              <Button
                type="button"
                variant="secondary"
                disabled={
                  license.status === 'revoked' ||
                  !onRevoke ||
                  revokingId === license.id
                }
                onClick={() => onRevoke?.(license.id)}
              >
                {revokingId === license.id ? 'Saving…' : 'Revoke'}
              </Button>
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
