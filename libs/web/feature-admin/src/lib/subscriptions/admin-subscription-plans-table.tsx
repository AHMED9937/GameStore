import Link from 'next/link';
import { Badge, Button } from '@gamestore/shared/ui';
import { AdminTable } from '../components/admin-table';
import {
  AdminSelectableRow,
  AdminSelectableTable,
} from '../components/admin-selectable-table';
import type { AdminSubscriptionPlanListItem } from './admin-subscription-plans.types';
import { ADMIN_SUBSCRIPTION_PLAN_COLUMNS } from './subscriptions.constants';
import type { AdminTableSelectionProps } from '../types/admin-table-selection';
import styles from './subscriptions.module.css';

export type AdminSubscriptionPlansTableProps = {
  plans: AdminSubscriptionPlanListItem[];
  selection?: AdminTableSelectionProps;
};

function formatBilling(interval: string, intervalCount: number): string {
  if (intervalCount === 1) {
    return interval;
  }
  return `every ${intervalCount} ${interval}s`;
}

function renderRowCells(plan: AdminSubscriptionPlanListItem) {
  return (
    <>
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
    </>
  );
}

export function AdminSubscriptionPlansTable({
  plans,
  selection,
}: AdminSubscriptionPlansTableProps) {
  if (!selection) {
    return (
      <div data-testid="admin-subscription-plans-table">
        <AdminTable
          columns={[...ADMIN_SUBSCRIPTION_PLAN_COLUMNS]}
          caption="Admin subscription plans"
        >
          {plans.map((plan) => (
            <tr key={plan.id}>{renderRowCells(plan)}</tr>
          ))}
        </AdminTable>
      </div>
    );
  }

  return (
    <div data-testid="admin-subscription-plans-table">
      <AdminSelectableTable
        columns={[...ADMIN_SUBSCRIPTION_PLAN_COLUMNS]}
        caption="Admin subscription plans"
        selectedCount={plans.filter((plan) => selection.isSelected(plan.id)).length}
        allVisibleSelected={selection.allVisibleSelected}
        someVisibleSelected={selection.someVisibleSelected}
        onToggleAllVisible={selection.toggleAllVisible}
        selectionDisabled={selection.disabled}
      >
        {plans.map((plan) => (
          <AdminSelectableRow
            key={plan.id}
            id={plan.id}
            selected={selection.isSelected(plan.id)}
            disabled={!selection.isRowSelectable(plan.id) || selection.disabled}
            onToggle={selection.toggleRow}
          >
            {renderRowCells(plan)}
          </AdminSelectableRow>
        ))}
      </AdminSelectableTable>
    </div>
  );
}
