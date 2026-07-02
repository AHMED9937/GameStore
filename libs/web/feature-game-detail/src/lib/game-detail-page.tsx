import { ApiError, getGameBySlug } from '@gamestore/web/data-access';
import { Container, EmptyState, Heading } from '@gamestore/shared/ui';
import { GameDetailBuyCta } from './components/game-detail-buy-cta';
import { GameDetailBuyPanel } from './components/game-detail-buy-panel';
import { GameDetailHeroMeta } from './components/game-detail-hero-meta';
import { GameDetailTabs } from './components/game-detail-tabs';
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

  return (
    <section className={styles.section}>
      <Container>
        <header>
          <Heading level="h1" className={styles.heroTitle}>
            {game.title}
          </Heading>
          <GameDetailHeroMeta
            platform={game.platform}
            releaseDate={game.releaseDate}
            genres={game.genres}
          />
          <GameDetailBuyCta game={game} />
        </header>

        <div className={styles.layout} style={{ marginTop: '1.5rem' }}>
          <div className={styles.mainColumn}>
            {videos.length > 0 ? (
              <GameDetailVideoGallery videos={videos} title={game.title} />
            ) : game.coverImage ? (
              <img src={game.coverImage} alt="" className={styles.coverHero} loading="eager" />
            ) : null}

            {screenshots.length > 0 ? (
              <div className={styles.screenshotRow} aria-label="Screenshots">
                {screenshots.map((shot) => (
                  <img
                    key={shot.id}
                    src={shot.url}
                    alt=""
                    className={styles.screenshot}
                    loading="lazy"
                  />
                ))}
              </div>
            ) : null}

            <GameDetailTabs game={game} />
          </div>

          <aside className={styles.sidebar}>
            <GameDetailBuyPanel game={game} />
          </aside>
        </div>
      </Container>
    </section>
  );
}
