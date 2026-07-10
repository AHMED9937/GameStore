import { AdminAccountFormPage } from '@gamestore/web/feature-admin';

type AdminAccountNewPageProps = {
  searchParams?: Promise<{ gameId?: string }> | { gameId?: string };
};

export default async function AdminAccountNewPage({
  searchParams,
}: AdminAccountNewPageProps) {
  const resolved = searchParams ? await Promise.resolve(searchParams) : {};
  return <AdminAccountFormPage initialGameId={resolved.gameId} />;
}
