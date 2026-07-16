import { ApiError, getGameBySlug } from '@gamestore/web/data-access';
import { truncateDescription } from '@gamestore/shared/seo';
import { Container, EmptyState, Heading, Text } from '@gamestore/shared/ui';
import { GameDetailBuyCta } from './components/game-detail-buy-cta';
import { GameDetailBuyPanel } from './components/game-detail-buy-panel';
import { GameDetailHeroMeta } from './components/game-detail-hero-meta';
import { GameDetailJsonLd } from './components/game-detail-json-ld';
import { GameDetailStickyBuyBar } from './components/game-detail-sticky-buy-bar';
import { GameDetailTabs } from './components/game-detail-tabs';
import { GameDetailScreenshotGallery } from './components/game-detail-screenshot-gallery';
import { GameDetailVideoGallery } from './components/game-detail-video-gallery';
import { splitMedia } from './game-detail.utils';
import styles from './components/game-detail.module.css';

export type GameDetailPageProps = {
  slug: string;
};

export async function GameDetailPage({ slug }: GameDetailPageProps) {
  let game: Awaited<ReturnType<typeof getGameBySlug>> | null = null;
  try {
    game = await getGameBySlug(slug);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 404) {
      game = null;
    }
  }

  if (!game) {
    return (
      <section className={styles.section}>
        <Container>
          <EmptyState
            title="Game not found"
            message={`No game exists for slug "${slug}" yet.`}
          />
        </Container>
      </section>
    );
  }

  const { videos, screenshots } = splitMedia(game.media);
  const seoExcerpt = truncateDescription(game.description?.trim() || '');

  return (
    <section className={styles.section}>
      <GameDetailJsonLd game={game} />
      <Container className={styles.detailContainer}>
        {/*
          Buy card shares the first row with the hero so it fills the
          top-right from first paint, then sticks while the left column scrolls.
        */}
        <div className={styles.layout}>
          <div className={styles.mainColumn}>
            <header className={styles.hero}>
              <Heading level="h1" className={styles.heroTitle}>
                {game.title}
              </Heading>
              {seoExcerpt ? (
                <Text tone="muted" className={styles.seoExcerpt}>
                  {seoExcerpt}
                </Text>
              ) : null}
              <GameDetailHeroMeta
                platform={game.platform}
                releaseDate={game.releaseDate}
                genres={game.genres}
              />
              <GameDetailBuyCta game={game} />
            </header>

            {videos.length > 0 ? (
              <GameDetailVideoGallery videos={videos} title={game.title} />
            ) : game.coverImage ? (
              <img
                src={game.coverImage}
                alt={`${game.title} cover`}
                className={styles.coverHero}
                loading="eager"
              />
            ) : null}

            {screenshots.length > 0 ? (
              <GameDetailScreenshotGallery
                screenshots={screenshots}
                title={game.title}
              />
            ) : null}

            <GameDetailTabs game={game} />
          </div>

          <aside className={styles.sidebar} aria-label="Purchase">
            <GameDetailBuyPanel game={game} />
          </aside>
        </div>
      </Container>
      <GameDetailStickyBuyBar game={game} />
    </section>
  );
}
