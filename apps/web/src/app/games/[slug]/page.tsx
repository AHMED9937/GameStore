import type { Metadata } from 'next';
import { ApiError, getGameBySlug } from '@gamestore/web/data-access';
import { buildGameMetadata } from '@gamestore/shared/seo';
import { GameDetailPage } from '@gamestore/web/feature-game-detail';

export const revalidate = 60;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const game = await getGameBySlug(slug);
    return buildGameMetadata(game);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return {
        title: 'Game not found',
        robots: { index: false, follow: false },
      };
    }

    return {
      title: 'Game not found',
      robots: { index: false, follow: false },
    };
  }
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  return <GameDetailPage slug={slug} />;
}
