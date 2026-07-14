import Link from 'next/link';
import { Badge } from '@gamestore/shared/ui';
import { AdminTable } from '../components/admin-table';
import {
  IconDeactivate,
  IconEdit,
  IconReactivate,
} from '../components/admin-action-icons';
import { AdminRowActionButton } from '../components/admin-row-action-button';
import {
  AdminSelectableRow,
  AdminSelectableTable,
} from '../components/admin-selectable-table';
import type { AdminAccountListItem } from './admin-accounts.types';
import { ADMIN_ACCOUNT_COLUMNS } from './accounts.constants';
import type { AdminTableSelectionProps } from '../types/admin-table-selection';
import styles from './accounts.module.css';

export type AdminAccountsTableProps = {
  accounts: AdminAccountListItem[];
  deactivatingId?: string | null;
  reactivatingId?: string | null;
  onDeactivate?: (accountId: string) => void;
  onReactivate?: (accountId: string) => void;
  selection?: AdminTableSelectionProps;
};

function renderRowCells(
  account: AdminAccountListItem,
  deactivatingId: string | null,
  reactivatingId: string | null,
  onDeactivate?: (accountId: string) => void,
  onReactivate?: (accountId: string) => void,
) {
  return (
    <>
      <td>{account.gameTitle ?? 'Unassigned'}</td>
      <td>{account.username}</td>
      <td>{account.platform}</td>
      <td>{account.region}</td>
      <td>
        {account.activeUsersCount} / {account.maxActiveUsers}
        {account.poolStatus === 'full'
          ? ' (full)'
          : account.poolStatus === 'locked'
            ? ' (locked)'
            : ''}
      </td>
      <td>
        <Badge
          variant={
            account.poolStatus === 'available'
              ? 'success'
              : account.poolStatus === 'inactive'
                ? 'default'
                : 'accent'
          }
        >
          {account.poolStatus === 'available'
            ? 'Available'
            : account.poolStatus === 'full'
              ? 'Full'
              : account.poolStatus === 'locked'
                ? 'Locked'
                : 'Inactive'}
        </Badge>
      </td>
      <td>
        <div className={styles.tableActions}>
          <Link
            href={`/admin/accounts/${account.id}`}
            aria-label={`Edit account ${account.username}`}
            title={`Edit account ${account.username}`}
          >
            <AdminRowActionButton
              label={`Edit account ${account.username}`}
              icon={<IconEdit />}
            />
          </Link>
          {account.isActive ? (
            <AdminRowActionButton
              label={`Deactivate account ${account.username}`}
              icon={<IconDeactivate />}
              disabled={!onDeactivate || deactivatingId === account.id}
              onClick={() => onDeactivate?.(account.id)}
            />
          ) : (
            <AdminRowActionButton
              label={`Reactivate account ${account.username}`}
              icon={<IconReactivate />}
              disabled={!onReactivate || reactivatingId === account.id}
              onClick={() => onReactivate?.(account.id)}
            />
          )}
        </div>
      </td>
    </>
  );
}

export function AdminAccountsTable({
  accounts,
  deactivatingId = null,
  reactivatingId = null,
  onDeactivate,
  onReactivate,
  selection,
}: AdminAccountsTableProps) {
  if (!selection) {
    return (
      <div data-testid="admin-accounts-table">
        <AdminTable columns={[...ADMIN_ACCOUNT_COLUMNS]} caption="Admin Steam account pool">
          {accounts.map((account) => (
            <tr key={account.id}>
              {renderRowCells(
                account,
                deactivatingId,
                reactivatingId,
                onDeactivate,
                onReactivate,
              )}
            </tr>
          ))}
        </AdminTable>
      </div>
    );
  }

  return (
    <div data-testid="admin-accounts-table">
      <AdminSelectableTable
        columns={[...ADMIN_ACCOUNT_COLUMNS]}
        caption="Admin Steam account pool"
        selectedCount={accounts.filter((account) => selection.isSelected(account.id)).length}
        allVisibleSelected={selection.allVisibleSelected}
        someVisibleSelected={selection.someVisibleSelected}
        onToggleAllVisible={selection.toggleAllVisible}
        selectionDisabled={selection.disabled}
      >
        {accounts.map((account) => (
          <AdminSelectableRow
            key={account.id}
            id={account.id}
            selected={selection.isSelected(account.id)}
            disabled={!selection.isRowSelectable(account.id) || selection.disabled}
            onToggle={selection.toggleRow}
          >
            {renderRowCells(
              account,
              deactivatingId,
              reactivatingId,
              onDeactivate,
              onReactivate,
            )}
          </AdminSelectableRow>
        ))}
      </AdminSelectableTable>
    </div>
  );
}
