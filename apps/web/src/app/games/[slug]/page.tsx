import { GameDetailPage } from '@gamestore/web/feature-game-detail';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  return <GameDetailPage slug={slug} />;
}
