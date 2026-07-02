import { AdminAccountEditPage } from '@gamestore/web/feature-admin';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminAccountEditRoute({ params }: PageProps) {
  const { id } = await params;
  return <AdminAccountEditPage accountId={id} />;
}
