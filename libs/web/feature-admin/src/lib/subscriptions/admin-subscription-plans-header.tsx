import Link from 'next/link';
import { Button } from '@gamestore/shared/ui';
import { AdminPageHeader } from '../components/admin-page-header';

export function AdminSubscriptionPlansHeader() {
  return (
    <AdminPageHeader
      title="Subscription plans"
      description="Define Stripe-backed plans and link published games for all-access access."
      actions={
        <Link href="/admin/subscriptions/new">
          <Button type="button">Add plan</Button>
        </Link>
      }
    />
  );
}
