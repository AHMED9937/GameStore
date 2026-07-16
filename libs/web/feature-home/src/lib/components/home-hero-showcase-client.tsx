'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Game } from '@gamestore/web/data-access';
import {
  formatGamePrice,
  getGameCardCover,
  resolveActiveGameDiscount,
} from '@gamestore/web/data-access';
import {
  GameDealUrgency,
  GameDiscountBadge,
  GamePriceDisplay,
  Text,
} from '@gamestore/shared/ui';
import Link from 'next/link';
import { HomeHeroShowcaseSkeleton } from './home-hero-showcase-skeleton';
import styles from './section.module.css';

export type HomeHeroShowcaseClientProps = {
  games: Game[];
};

export function HomeHeroShowcaseClient({ games }: HomeHeroShowcaseClientProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadedCovers, setLoadedCovers] = useState<Record<string, boolean>>({});
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

  const activeGame = count > 0 ? games[activeIndex] : null;
  const activeCover = activeGame ? getGameCardCover(activeGame) : '';
  const prevGame = count > 1 ? games[(activeIndex - 1 + count) % count] : null;
  const nextGame = count > 1 ? games[(activeIndex + 1) % count] : null;
  const isActiveCoverLoaded = activeCover
    ? loadedCovers[activeCover] === true
    : false;

  useEffect(() => {
    if (!activeCover || loadedCovers[activeCover]) {
      return;
    }

    let cancelled = false;
    const preloadImage = new Image();
    const markLoaded = () => {
      if (cancelled) {
        return;
      }
      setLoadedCovers((current) => ({ ...current, [activeCover]: true }));
    };

    preloadImage.onload = markLoaded;
    preloadImage.onerror = markLoaded;
    preloadImage.src = activeCover;

    return () => {
      cancelled = true;
    };
  }, [activeCover, loadedCovers]);

  if (count === 0 || !activeGame) {
    return null;
  }

  if (!isActiveCoverLoaded) {
    return <HomeHeroShowcaseSkeleton />;
  }

  const discount = resolveActiveGameDiscount(activeGame);

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

        <div className={styles.showcaseMainStack}>
          {discount?.showCountdown ? (
            <div className={styles.showcaseDealBanner}>
              <GameDealUrgency
                variant="bannerLg"
                endsAt={discount.endsAt}
                showCountdown
              />
            </div>
          ) : null}
          <Link
            href={`/games/${activeGame.slug}`}
            className={styles.showcaseMainCard}
            aria-label={`View ${activeGame.title}`}
          >
            <img
              src={activeCover}
              alt={activeGame.title}
              className={styles.showcaseMainImage}
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
            {discount ? (
              <GameDiscountBadge
                percentOff={discount.percentOff}
                className={styles.showcaseDiscountBadge}
              />
            ) : null}
            <div className={styles.showcaseMainOverlay}>
              <Text className={styles.showcaseMainTitle}>{activeGame.title}</Text>
              <GamePriceDisplay
                className={styles.showcaseMainPrice}
                size="md"
                priceBaseLabel={formatGamePrice(activeGame.priceBase)}
                priceSaleLabel={
                  discount ? formatGamePrice(discount.priceSale) : null
                }
                percentOff={discount?.percentOff ?? null}
              />
            </div>
          </Link>
        </div>

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
