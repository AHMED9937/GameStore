'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { GameMedia } from '@gamestore/web/data-access';
import styles from './game-detail.module.css';

export type GameDetailScreenshotGalleryProps = {
  screenshots: GameMedia[];
  title: string;
};

function shotAlt(shot: GameMedia, title: string, index: number) {
  return shot.title?.trim() || `${title} screenshot ${index + 1}`;
}

export function GameDetailScreenshotGallery({
  screenshots,
  title,
}: GameDetailScreenshotGalleryProps) {
  const labelId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const isOpen = activeIndex !== null;
  const active = isOpen ? screenshots[activeIndex] : null;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveIndex(null);
        return;
      }

      if (screenshots.length < 2) {
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setActiveIndex((current) =>
          current === null ? 0 : (current + 1) % screenshots.length,
        );
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setActiveIndex((current) =>
          current === null
            ? 0
            : (current - 1 + screenshots.length) % screenshots.length,
        );
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, screenshots.length]);

  if (screenshots.length === 0) {
    return null;
  }

  const goPrev = () => {
    setActiveIndex((current) =>
      current === null
        ? 0
        : (current - 1 + screenshots.length) % screenshots.length,
    );
  };

  const goNext = () => {
    setActiveIndex((current) =>
      current === null ? 0 : (current + 1) % screenshots.length,
    );
  };

  return (
    <>
      <div
        className={styles.screenshotRow}
        aria-label="Screenshots"
        data-testid="game-detail-screenshot-gallery"
      >
        {screenshots.map((shot, index) => (
          <button
            key={shot.id}
            type="button"
            className={styles.screenshotButton}
            onClick={() => setActiveIndex(index)}
            aria-label={`View ${shotAlt(shot, title, index)} larger`}
          >
            <img
              src={shot.url}
              alt=""
              className={styles.screenshot}
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {isOpen && active ? (
        <div
          className={styles.lightboxOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelId}
          data-testid="game-detail-screenshot-lightbox"
          onClick={() => setActiveIndex(null)}
        >
          <div
            className={styles.lightboxPanel}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.lightboxTop}>
              <p id={labelId} className={styles.lightboxCaption}>
                {shotAlt(active, title, activeIndex)}
                {screenshots.length > 1 ? (
                  <span className={styles.lightboxCount}>
                    {activeIndex + 1} / {screenshots.length}
                  </span>
                ) : null}
              </p>
              <button
                ref={closeRef}
                type="button"
                className={styles.lightboxClose}
                onClick={() => setActiveIndex(null)}
                aria-label="Close screenshot"
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div className={styles.lightboxStage}>
              {screenshots.length > 1 ? (
                <button
                  type="button"
                  className={`${styles.lightboxNav} ${styles.lightboxNavPrev}`}
                  onClick={goPrev}
                  aria-label="Previous screenshot"
                >
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M15 18l-6-6 6-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              ) : null}

              <img
                key={active.id}
                src={active.url}
                alt={shotAlt(active, title, activeIndex)}
                className={styles.lightboxImage}
              />

              {screenshots.length > 1 ? (
                <button
                  type="button"
                  className={`${styles.lightboxNav} ${styles.lightboxNavNext}`}
                  onClick={goNext}
                  aria-label="Next screenshot"
                >
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M9 18l6-6-6-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
