import { AdminSubscriptionPlanEditPage } from '@gamestore/web/feature-admin';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminSubscriptionPlanEditRoute({ params }: PageProps) {
  const { id } = await params;
  return <AdminSubscriptionPlanEditPage planId={id} />;
}
