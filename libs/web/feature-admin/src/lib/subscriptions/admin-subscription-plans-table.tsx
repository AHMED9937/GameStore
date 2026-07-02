import Link from 'next/link';
import { Badge, Button } from '@gamestore/shared/ui';
import { AdminTable } from '../components/admin-table';
import type { AdminSubscriptionPlanListItem } from './admin-subscription-plans.types';
import { ADMIN_SUBSCRIPTION_PLAN_COLUMNS } from './subscriptions.constants';
import styles from './subscriptions.module.css';

export type AdminSubscriptionPlansTableProps = {
  plans: AdminSubscriptionPlanListItem[];
};

function formatBilling(interval: string, intervalCount: number): string {
  if (intervalCount === 1) {
    return interval;
  }
  return `every ${intervalCount} ${interval}s`;
}

export function AdminSubscriptionPlansTable({
  plans,
}: AdminSubscriptionPlansTableProps) {
  return (
    <div data-testid="admin-subscription-plans-table">
      <AdminTable
        columns={[...ADMIN_SUBSCRIPTION_PLAN_COLUMNS]}
        caption="Admin subscription plans"
      >
        {plans.map((plan) => (
          <tr key={plan.id}>
            <td>{plan.name}</td>
            <td>
              <code>{plan.slug}</code>
            </td>
            <td>{formatBilling(plan.interval, plan.intervalCount)}</td>
            <td>{plan.gameCount}</td>
            <td>
              <Badge variant={plan.isActive ? 'success' : 'default'}>
                {plan.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </td>
            <td>
              <div className={styles.tableActions}>
                <Link href={`/admin/subscriptions/${plan.id}`}>
                  <Button type="button" variant="secondary">
                    Edit
                  </Button>
                </Link>
              </div>
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
