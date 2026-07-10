import { toEmbedPreviewUrl } from './video-guides.utils';
import styles from './video-guides.module.css';

export type AdminVideoPreviewProps = {
  url: string;
  title: string;
};

export function AdminVideoPreview({ url, title }: AdminVideoPreviewProps) {
  const previewUrl = toEmbedPreviewUrl(url);
  if (!previewUrl) {
    return null;
  }

  return (
    <div className={styles.videoPreview}>
      <iframe
        src={previewUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
