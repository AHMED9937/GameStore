import {
  computeSalePrice,
  formatPriceAmount,
  resolveDiscountStatus,
  type DiscountStatus,
} from '@gamestore/shared/pricing';

export type GameDiscountLike = {
  percentOff: number;
  startsAt: Date | string;
  endsAt: Date | string;
  showCountdown: boolean;
  enabled: boolean;
};

export type AdminGameDiscountDto = {
  percentOff: number;
  startsAt: string;
  endsAt: string;
  showCountdown: boolean;
  enabled: boolean;
  status: DiscountStatus;
  priceSale: string;
  durationDays: number;
  durationHours: number;
};

export type PublicGameDiscountDto = {
  percentOff: number;
  priceSale: string;
  endsAt: string;
  showCountdown: boolean;
};

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export function durationPartsFromWindow(
  startsAt: Date | string,
  endsAt: Date | string,
): { durationDays: number; durationHours: number } {
  const start = startsAt instanceof Date ? startsAt : new Date(startsAt);
  const end = endsAt instanceof Date ? endsAt : new Date(endsAt);
  const totalHours = Math.max(
    0,
    Math.floor((end.getTime() - start.getTime()) / (60 * 60 * 1000)),
  );
  return {
    durationDays: Math.floor(totalHours / 24),
    durationHours: totalHours % 24,
  };
}

export function toAdminGameDiscountDto(
  discount: GameDiscountLike,
  priceBase: number | string,
  now: Date | string = new Date(),
): AdminGameDiscountDto {
  const sale = computeSalePrice(priceBase, discount.percentOff);
  const { durationDays, durationHours } = durationPartsFromWindow(
    discount.startsAt,
    discount.endsAt,
  );
  return {
    percentOff: discount.percentOff,
    startsAt: toIso(discount.startsAt),
    endsAt: toIso(discount.endsAt),
    showCountdown: discount.showCountdown,
    enabled: discount.enabled,
    status: resolveDiscountStatus(discount, now),
    priceSale: Number.isFinite(sale)
      ? formatPriceAmount(sale)
      : formatPriceAmount(Number(priceBase)),
    durationDays,
    durationHours,
  };
}

/** Active-only public payload; null when not currently discounted. */
export function toPublicGameDiscountDto(
  discount: GameDiscountLike | null | undefined,
  priceBase: number | string,
  now: Date | string = new Date(),
): PublicGameDiscountDto | null {
  if (!discount || resolveDiscountStatus(discount, now) !== 'active') {
    return null;
  }
  const sale = computeSalePrice(priceBase, discount.percentOff);
  if (!Number.isFinite(sale) || sale < 0) {
    return null;
  }
  return {
    percentOff: discount.percentOff,
    priceSale: formatPriceAmount(sale),
    endsAt: toIso(discount.endsAt),
    showCountdown: discount.showCountdown,
  };
}
