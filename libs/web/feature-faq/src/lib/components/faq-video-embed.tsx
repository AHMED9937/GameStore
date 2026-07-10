import { Text } from '@gamestore/shared/ui';
import { toYoutubeEmbedUrl } from '../faq.utils';

export type FaqVideoEmbedProps = {
  url: string | null | undefined;
  title: string;
};

export function FaqVideoEmbed({ url, title }: FaqVideoEmbedProps) {
  const embedUrl = url ? toYoutubeEmbedUrl(url) : null;

  if (!embedUrl) {
    return (
      <Text tone="muted" className="faq-video-fallback">
        Video guide coming soon.
      </Text>
    );
  }

  return (
    <div className="detail-media">
      <iframe
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
