import { buildProductJsonLd } from '@gamestore/shared/seo';
import type { GameDetail } from '@gamestore/web/data-access';
import { resolveActiveGameDiscount } from '@gamestore/web/data-access';

export type GameDetailJsonLdProps = {
  game: GameDetail;
};

export function GameDetailJsonLd({ game }: GameDetailJsonLdProps) {
  const activeDiscount = resolveActiveGameDiscount(game);
  const jsonLd = buildProductJsonLd({
    ...game,
    priceOffer: activeDiscount?.priceSale ?? null,
  });

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
