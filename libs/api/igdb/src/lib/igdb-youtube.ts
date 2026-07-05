export function toYoutubeEmbedFromIgdbVideoId(videoId?: string): string | null {
  if (!videoId?.trim()) {
    return null;
  }

  const trimmed = videoId.trim();
  const fromUrl = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  const id = fromUrl?.[1] ?? trimmed;
  if (!/^[A-Za-z0-9_-]{6,}$/.test(id)) {
    return null;
  }

  return `https://www.youtube.com/embed/${id}`;
}

export function extractYoutubeVideoId(embedUrl: string): string | null {
  const match = embedUrl.match(/\/embed\/([A-Za-z0-9_-]{6,})/);
  return match?.[1] ?? null;
}
