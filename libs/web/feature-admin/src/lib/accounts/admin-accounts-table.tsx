import { Badge, Button } from '@gamestore/shared/ui';
import { AdminTable } from '../components/admin-table';
import type { AdminAccountListItem } from './admin-accounts.types';
import { ADMIN_ACCOUNT_COLUMNS } from './accounts.constants';

export type AdminAccountsTableProps = {
  accounts: AdminAccountListItem[];
  deactivatingId?: string | null;
  onDeactivate?: (accountId: string) => void;
};

export function AdminAccountsTable({
  accounts,
  deactivatingId = null,
  onDeactivate,
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
            <td>{account.activeUsersCount}</td>
            <td>
              <Badge variant={account.isActive ? 'success' : 'default'}>
                {account.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </td>
            <td>
              <Button
                type="button"
                variant="secondary"
                disabled={!account.isActive || !onDeactivate || deactivatingId === account.id}
                onClick={() => onDeactivate?.(account.id)}
              >
                {deactivatingId === account.id ? 'Saving…' : 'Deactivate'}
              </Button>
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
