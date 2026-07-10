import type {
  DefaultGameSeoFields,
  DefaultGameSeoFieldsInput,
} from './seo-game.types';
import { formatPlatformLabel } from './format-platform-label';
import { truncateDescription } from './truncate-description';

function formatPrice(priceBase: number | string): string {
  const value = typeof priceBase === 'string' ? Number.parseFloat(priceBase) : priceBase;
  if (!Number.isFinite(value)) {
    return '0.00';
  }
  return value.toFixed(2);
}

export function buildDefaultGameSeoFields(
  input: DefaultGameSeoFieldsInput,
): DefaultGameSeoFields {
  const platformLabel = formatPlatformLabel(input.platform);
  const metaTitle = `Buy ${input.title} — ${platformLabel} Activation`;

  const summary = input.summary?.trim() ?? '';
  const price = formatPrice(input.priceBase);
  const suffix = ` Instant delivery, offline play, activation guide included. From $${price}.`;
  const metaDescription = summary
    ? truncateDescription(`${summary}${suffix}`)
    : truncateDescription(
        `Get ${input.title} for ${platformLabel}.${suffix}`.trim(),
      );

  return {
    metaTitle,
    metaDescription,
    ogImage: input.coverImage?.trim() || null,
  };
}
