import { buildProductJsonLd } from '@gamestore/shared/seo';
import type { GameDetail } from '@gamestore/web/data-access';

export type GameDetailJsonLdProps = {
  game: GameDetail;
};

export function GameDetailJsonLd({ game }: GameDetailJsonLdProps) {
  const jsonLd = buildProductJsonLd(game);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
