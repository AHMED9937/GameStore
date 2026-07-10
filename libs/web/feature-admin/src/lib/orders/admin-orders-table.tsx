import { Badge } from '@gamestore/shared/ui';
import { AdminTable } from '../components/admin-table';
import {
  AdminSelectableRow,
  AdminSelectableTable,
} from '../components/admin-selectable-table';
import type { AdminOrderListItem } from './admin-orders.types';
import { ADMIN_ORDER_COLUMNS } from './orders.constants';
import type { AdminTableSelectionProps } from '../types/admin-table-selection';

export type AdminOrdersTableProps = {
  orders: AdminOrderListItem[];
  selection?: AdminTableSelectionProps;
};

function statusVariant(
  status: string,
): 'default' | 'accent' | 'success' {
  if (status === 'completed') {
    return 'success';
  }
  if (status === 'pending') {
    return 'accent';
  }
  return 'default';
}

function formatOrderStatus(status: string): string {
  if (status === 'failed') {
    return 'Canceled';
  }
  return status;
}

function formatAmount(amount: string, currency: string): string {
  const value = Number.parseFloat(amount);
  if (Number.isNaN(value)) {
    return `${amount} ${currency}`;
  }
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(value);
  } catch {
    return `${amount} ${currency}`;
  }
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatOrderType(orderType: string): string {
  return orderType === 'subscription' ? 'Subscription' : 'One-time';
}

function renderRowCells(order: AdminOrderListItem) {
  return (
    <>
      <td>{order.gameTitle}</td>
      <td>
        <Badge variant="default">{formatOrderType(order.orderType)}</Badge>
      </td>
      <td>{formatAmount(order.amount, order.currency)}</td>
      <td>{order.buyerEmail ?? order.ownerEmail ?? '—'}</td>
      <td>
        <Badge variant={statusVariant(order.status)} data-testid={`order-status-${order.id}`}>
          {formatOrderStatus(order.status)}
        </Badge>
      </td>
      <td>
        {order.licenseKeyMasked ? (
          <span>
            <code>{order.licenseKeyMasked}</code>
            {order.licenseSource ? (
              <span> ({order.licenseSource})</span>
            ) : null}
          </span>
        ) : (
          '—'
        )}
      </td>
      <td>{formatDate(order.createdAt)}</td>
    </>
  );
}

export function AdminOrdersTable({ orders, selection }: AdminOrdersTableProps) {
  if (!selection) {
    return (
      <div data-testid="admin-orders-table">
        <AdminTable columns={[...ADMIN_ORDER_COLUMNS]} caption="Admin orders">
          {orders.map((order) => (
            <tr key={order.id}>{renderRowCells(order)}</tr>
          ))}
        </AdminTable>
      </div>
    );
  }

  return (
    <div data-testid="admin-orders-table">
      <AdminSelectableTable
        columns={[...ADMIN_ORDER_COLUMNS]}
        caption="Admin orders"
        selectedCount={orders.filter((order) => selection.isSelected(order.id)).length}
        allVisibleSelected={selection.allVisibleSelected}
        someVisibleSelected={selection.someVisibleSelected}
        onToggleAllVisible={selection.toggleAllVisible}
        selectionDisabled={selection.disabled}
      >
        {orders.map((order) => (
          <AdminSelectableRow
            key={order.id}
            id={order.id}
            selected={selection.isSelected(order.id)}
            disabled={!selection.isRowSelectable(order.id) || selection.disabled}
            onToggle={selection.toggleRow}
          >
            {renderRowCells(order)}
          </AdminSelectableRow>
        ))}
      </AdminSelectableTable>
    </div>
  );
}
