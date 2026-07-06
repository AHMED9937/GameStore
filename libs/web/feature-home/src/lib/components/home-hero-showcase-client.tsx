'use client';

import { useCallback, useState } from 'react';
import type { Game } from '@gamestore/web/data-access';
import { formatGamePrice, getGameCardCover } from '@gamestore/web/data-access';
import { Text } from '@gamestore/shared/ui';
import Link from 'next/link';
import styles from './section.module.css';

export type HomeHeroShowcaseClientProps = {
  games: Game[];
};

export function HomeHeroShowcaseClient({ games }: HomeHeroShowcaseClientProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const count = games.length;

  const goTo = useCallback(
    (index: number) => {
      if (count === 0) return;
      setActiveIndex(((index % count) + count) % count);
    },
    [count],
  );

  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);
  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);

  if (count === 0) {
    return null;
  }

  const activeGame = games[activeIndex];
  const prevGame = count > 1 ? games[(activeIndex - 1 + count) % count] : null;
  const nextGame = count > 1 ? games[(activeIndex + 1) % count] : null;

  return (
    <div className={styles.showcaseCarousel} aria-label="Featured game showcase">
      <div className={styles.showcaseStage}>
        {prevGame ? (
          <button
            type="button"
            className={`${styles.showcasePeek} ${styles.showcasePeekLeft}`}
            onClick={goPrev}
            aria-label={`Show previous: ${prevGame.title}`}
          >
            <img
              src={getGameCardCover(prevGame)}
              alt=""
              className={styles.showcasePeekImage}
            />
          </button>
        ) : null}

        <Link
          href={`/games/${activeGame.slug}`}
          className={styles.showcaseMainCard}
          aria-label={`View ${activeGame.title}`}
        >
          <img
            src={getGameCardCover(activeGame)}
            alt={activeGame.title}
            className={styles.showcaseMainImage}
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
          <div className={styles.showcaseMainOverlay}>
            <Text className={styles.showcaseMainTitle}>{activeGame.title}</Text>
            <Text tone="muted" className={styles.showcaseMainPrice}>
              {formatGamePrice(activeGame.priceBase)}
            </Text>
          </div>
        </Link>

        {nextGame ? (
          <button
            type="button"
            className={`${styles.showcasePeek} ${styles.showcasePeekRight}`}
            onClick={goNext}
            aria-label={`Show next: ${nextGame.title}`}
          >
            <img
              src={getGameCardCover(nextGame)}
              alt=""
              className={styles.showcasePeekImage}
            />
          </button>
        ) : null}

        {count > 1 ? (
          <>
            <button
              type="button"
              className={`${styles.showcaseNavBtn} ${styles.showcaseNavPrev}`}
              onClick={goPrev}
              aria-label="Previous featured game"
            >
              ‹
            </button>
            <button
              type="button"
              className={`${styles.showcaseNavBtn} ${styles.showcaseNavNext}`}
              onClick={goNext}
              aria-label="Next featured game"
            >
              ›
            </button>
          </>
        ) : null}
      </div>

      {count > 1 ? (
        <div
          className={styles.showcaseThumbBar}
          role="tablist"
          aria-label="Select featured game"
        >
          {games.map((game, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={game.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={game.title}
                className={
                  isActive ? styles.showcaseThumbActive : styles.showcaseThumb
                }
                onClick={() => goTo(index)}
              >
                <img
                  src={getGameCardCover(game)}
                  alt=""
                  className={styles.showcaseThumbImage}
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
