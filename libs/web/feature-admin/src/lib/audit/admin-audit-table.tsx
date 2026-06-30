import { AdminTable } from '../components/admin-table';
import type { AdminAuditLogItem } from './admin-audit.types';
import { ADMIN_AUDIT_COLUMNS } from './audit.constants';

export type AdminAuditTableProps = {
  logs: AdminAuditLogItem[];
};

export function AdminAuditTable({ logs }: AdminAuditTableProps) {
  return (
    <div data-testid="admin-audit-table">
      <AdminTable columns={[...ADMIN_AUDIT_COLUMNS]} caption="Admin audit log">
        {logs.map((log) => (
          <tr key={log.id}>
            <td>{log.createdAt}</td>
            <td>{log.actorEmail}</td>
            <td>{log.action}</td>
            <td>{log.resource}</td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
