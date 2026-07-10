export function truncateDescription(text: string, maxLen = 160): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return '';
  }

  if (normalized.length <= maxLen) {
    return normalized;
  }

  const slice = normalized.slice(0, maxLen);
  const lastSpace = slice.lastIndexOf(' ');
  const trimmed =
    lastSpace > maxLen * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${trimmed.trimEnd()}…`;
}
