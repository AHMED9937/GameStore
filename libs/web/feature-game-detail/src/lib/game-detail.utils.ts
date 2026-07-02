import type { GameMedia } from '@gamestore/web/data-access';

export function toYoutubeEmbedUrl(url: string): string | null {
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

export function splitMedia(media: GameMedia[]) {
  const videos = media.filter((item) => item.type === 'video');
  const screenshots = media.filter((item) => item.type === 'screenshot');
  const activation = media.find((item) => item.type === 'activation') ?? null;

  return { videos, screenshots, activation };
}

export type RequirementRow = {
  label: string;
  value: string;
};

export function parseRequirements(text: string): RequirementRow[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) {
        return { label: 'Note', value: line };
      }

      return {
        label: line.slice(0, colonIndex).trim(),
        value: line.slice(colonIndex + 1).trim(),
      };
    });
}

export function formatReleaseDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatPlatformLabel(platform: string): string {
  switch (platform.toLowerCase()) {
    case 'steam':
      return 'Steam';
    case 'epic':
      return 'Epic Games';
    case 'microsoft':
    case 'xbox':
      return 'Microsoft Store';
    default:
      return platform;
  }
}
