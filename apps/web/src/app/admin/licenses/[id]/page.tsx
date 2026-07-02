import { AdminLicenseDetailPage } from '@gamestore/web/feature-admin';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminLicenseDetailRoute({ params }: PageProps) {
  const { id } = await params;
  return <AdminLicenseDetailPage licenseId={id} />;
}
