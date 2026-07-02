'use client';

import { useState } from 'react';
import type { GameMedia } from '@gamestore/web/data-access';
import { toYoutubeEmbedUrl } from '../game-detail.utils';
import styles from './game-detail.module.css';

export type GameDetailVideoGalleryProps = {
  videos: GameMedia[];
  title: string;
};

export function GameDetailVideoGallery({ videos, title }: GameDetailVideoGalleryProps) {
  const embeds = videos
    .map((video) => ({
      id: video.id,
      label: video.title ?? title,
      embedUrl: toYoutubeEmbedUrl(video.url),
    }))
    .filter((video): video is typeof video & { embedUrl: string } => Boolean(video.embedUrl));

  const [activeId, setActiveId] = useState(embeds[0]?.id ?? '');

  if (embeds.length === 0) {
    return null;
  }

  const active = embeds.find((video) => video.id === activeId) ?? embeds[0];

  return (
    <div className={styles.videoGallery} data-testid="game-detail-video-gallery">
      <div className={styles.videoMain}>
        <iframe
          key={active.id}
          src={active.embedUrl}
          title={active.label}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
      {embeds.length > 1 ? (
        <div className={styles.videoThumbs} role="tablist" aria-label="Game videos">
          {embeds.map((video) => (
            <button
              key={video.id}
              type="button"
              role="tab"
              aria-selected={video.id === active.id}
              className={
                video.id === active.id
                  ? `${styles.videoThumb} ${styles.videoThumbActive}`
                  : styles.videoThumb
              }
              onClick={() => setActiveId(video.id)}
            >
              <span className={styles.videoThumbPlay} aria-hidden>
                ▶
              </span>
              <span className={styles.videoThumbLabel}>{video.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
