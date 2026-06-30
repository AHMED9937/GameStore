import { AdminGameEditPage } from '@gamestore/web/feature-admin';

type AdminGameEditRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminGameEditRoute({ params }: AdminGameEditRouteProps) {
  const { id } = await params;
  return <AdminGameEditPage gameId={id} />;
}
