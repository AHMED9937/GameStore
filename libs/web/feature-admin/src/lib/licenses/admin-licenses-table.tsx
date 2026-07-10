import Link from 'next/link';
import { Badge } from '@gamestore/shared/ui';
import { AdminTable } from '../components/admin-table';
import { IconEdit, IconRevoke } from '../components/admin-action-icons';
import { AdminRowActionButton } from '../components/admin-row-action-button';
import {
  AdminSelectableRow,
  AdminSelectableTable,
} from '../components/admin-selectable-table';
import type { AdminLicenseListItem } from './admin-licenses.types';
import { ADMIN_LICENSE_COLUMNS } from './licenses.constants';
import type { AdminTableSelectionProps } from '../types/admin-table-selection';
import styles from './licenses.module.css';

export type AdminLicensesTableProps = {
  licenses: AdminLicenseListItem[];
  revokingId?: string | null;
  onRevoke?: (licenseId: string) => void;
  selection?: AdminTableSelectionProps;
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

import { getLicenseExpiryState } from '@gamestore/web/feature-subscriptions';
function renderRowCells(
  license: AdminLicenseListItem,
  revokingId: string | null,
  onRevoke?: (licenseId: string) => void,
) {
  return (
    <>
      <td>
        <code>{license.licenseKeyMasked}</code>
      </td>
      <td>{license.gameTitle}</td>
      <td>{license.source}</td>
      <td>{license.ownerEmail ?? '—'}</td>
      <td>
        <Badge variant={statusVariant(license.status)}>{license.status}</Badge>
      </td>
      <td>
        {getLicenseExpiryState(license.expiresAt).label}
      </td>
      <td>
        <div className={styles.tableActions}>
          <Link
            href={`/admin/licenses/${license.id}`}
            aria-label={`Edit license ${license.licenseKeyMasked}`}
            title={`Edit license ${license.licenseKeyMasked}`}
          >
            <AdminRowActionButton
              label={`Edit license ${license.licenseKeyMasked}`}
              icon={<IconEdit />}
            />
          </Link>
          <AdminRowActionButton
            label={`Revoke license ${license.licenseKeyMasked}`}
            icon={<IconRevoke />}
            disabled={
              license.status === 'revoked' ||
              !onRevoke ||
              revokingId === license.id
            }
            onClick={() => onRevoke?.(license.id)}
          />
        </div>
      </td>
    </>
  );
}

export function AdminLicensesTable({
  licenses,
  revokingId = null,
  onRevoke,
  selection,
}: AdminLicensesTableProps) {
  if (!selection) {
    return (
      <div data-testid="admin-licenses-table">
        <AdminTable columns={[...ADMIN_LICENSE_COLUMNS]} caption="Admin licenses">
          {licenses.map((license) => (
            <tr key={license.id}>
              {renderRowCells(license, revokingId, onRevoke)}
            </tr>
          ))}
        </AdminTable>
      </div>
    );
  }

  return (
    <div data-testid="admin-licenses-table">
      <AdminSelectableTable
        columns={[...ADMIN_LICENSE_COLUMNS]}
        caption="Admin licenses"
        selectedCount={licenses.filter((license) => selection.isSelected(license.id)).length}
        allVisibleSelected={selection.allVisibleSelected}
        someVisibleSelected={selection.someVisibleSelected}
        onToggleAllVisible={selection.toggleAllVisible}
        selectionDisabled={selection.disabled}
      >
        {licenses.map((license) => (
          <AdminSelectableRow
            key={license.id}
            id={license.id}
            selected={selection.isSelected(license.id)}
            disabled={!selection.isRowSelectable(license.id) || selection.disabled}
            onToggle={selection.toggleRow}
          >
            {renderRowCells(license, revokingId, onRevoke)}
          </AdminSelectableRow>
        ))}
      </AdminSelectableTable>
    </div>
  );
}
