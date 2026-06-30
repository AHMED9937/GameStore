import { AdminPageHeader } from '../components/admin-page-header';

export function AdminOrdersHeader() {
  return (
    <AdminPageHeader
      title="Orders"
      description="Review purchases and fulfillment status. Stripe integration connects in a later slice."
    />
  );
}
