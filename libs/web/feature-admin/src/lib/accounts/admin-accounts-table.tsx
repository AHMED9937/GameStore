import Link from 'next/link';
import { Badge, Button } from '@gamestore/shared/ui';
import { AdminTable } from '../components/admin-table';
import type { AdminAccountListItem } from './admin-accounts.types';
import { ADMIN_ACCOUNT_COLUMNS } from './accounts.constants';
import styles from './accounts.module.css';

export type AdminAccountsTableProps = {
  accounts: AdminAccountListItem[];
  deactivatingId?: string | null;
  reactivatingId?: string | null;
  onDeactivate?: (accountId: string) => void;
  onReactivate?: (accountId: string) => void;
};

export function AdminAccountsTable({
  accounts,
  deactivatingId = null,
  reactivatingId = null,
  onDeactivate,
  onReactivate,
}: AdminAccountsTableProps) {
  return (
    <div data-testid="admin-accounts-table">
      <AdminTable columns={[...ADMIN_ACCOUNT_COLUMNS]} caption="Admin Steam account pool">
        {accounts.map((account) => (
          <tr key={account.id}>
            <td>{account.gameTitle}</td>
            <td>{account.username}</td>
            <td>{account.platform}</td>
            <td>{account.region}</td>
            <td>
              {account.activeUsersCount} / {account.maxActiveUsers}
            </td>
            <td>
              <Badge variant={account.isActive ? 'success' : 'default'}>
                {account.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </td>
            <td>
              <div className={styles.tableActions}>
                <Link href={`/admin/accounts/${account.id}`}>
                  <Button type="button" variant="secondary">
                    Edit
                  </Button>
                </Link>
                {account.isActive ? (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={!onDeactivate || deactivatingId === account.id}
                    onClick={() => onDeactivate?.(account.id)}
                  >
                    {deactivatingId === account.id ? 'Saving…' : 'Deactivate'}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={!onReactivate || reactivatingId === account.id}
                    onClick={() => onReactivate?.(account.id)}
                  >
                    {reactivatingId === account.id ? 'Saving…' : 'Reactivate'}
                  </Button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
