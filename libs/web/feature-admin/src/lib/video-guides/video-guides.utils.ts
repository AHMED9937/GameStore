export function toEmbedPreviewUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.includes('youtube.com/embed/')) {
    return trimmed.startsWith('http') ? trimmed : `https:${trimmed}`;
  }
  const watchMatch = trimmed.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/,
  );
  if (watchMatch?.[1]) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }
  return trimmed.startsWith('http') ? trimmed : null;
}
