export type DiscountDuration = {
  days: number;
  hours: number;
};

export type DiscountWindowInput = {
  enabled: boolean;
  startsAt: Date | string;
  endsAt: Date | string;
};

export type DiscountStatus = 'none' | 'scheduled' | 'active' | 'expired' | 'disabled';

export type EffectivePriceResult = {
  priceBase: number;
  priceSale: number;
  percentOff: number | null;
  isDiscounted: boolean;
};

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function toPriceNumber(priceBase: number | string): number {
  const value = typeof priceBase === 'string' ? Number.parseFloat(priceBase) : priceBase;
  return Number.isFinite(value) ? value : Number.NaN;
}

/** Half-up rounding to 2 decimal places (currency cents). */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Computes sale price from base price and percent off.
 * Returns NaN when inputs are invalid or sale would be negative.
 */
export function computeSalePrice(
  priceBase: number | string,
  percentOff: number,
): number {
  const base = toPriceNumber(priceBase);
  if (!Number.isFinite(base) || base <= 0) {
    return Number.NaN;
  }
  if (!Number.isInteger(percentOff) || percentOff < 1 || percentOff > 100) {
    return Number.NaN;
  }
  const sale = roundMoney(base * (1 - percentOff / 100));
  return sale >= 0 ? sale : Number.NaN;
}

export function computeEndsAt(
  startsAt: Date | string,
  duration: DiscountDuration,
): Date {
  const start = toDate(startsAt);
  const days = Number.isFinite(duration.days) ? Math.max(0, Math.floor(duration.days)) : 0;
  const hours = Number.isFinite(duration.hours) ? Math.max(0, Math.floor(duration.hours)) : 0;
  const ms = days * 24 * 60 * 60 * 1000 + hours * 60 * 60 * 1000;
  return new Date(start.getTime() + ms);
}

export function isValidDiscountDuration(duration: DiscountDuration): boolean {
  const days = Number.isFinite(duration.days) ? Math.floor(duration.days) : 0;
  const hours = Number.isFinite(duration.hours) ? Math.floor(duration.hours) : 0;
  return days >= 0 && hours >= 0 && (days > 0 || hours > 0);
}

export function resolveDiscountStatus(
  discount: DiscountWindowInput | null | undefined,
  now: Date | string = new Date(),
): DiscountStatus {
  if (!discount) {
    return 'none';
  }
  if (!discount.enabled) {
    return 'disabled';
  }
  const current = toDate(now).getTime();
  const startsAt = toDate(discount.startsAt).getTime();
  const endsAt = toDate(discount.endsAt).getTime();
  if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt) || endsAt <= startsAt) {
    return 'expired';
  }
  if (current < startsAt) {
    return 'scheduled';
  }
  if (current >= endsAt) {
    return 'expired';
  }
  return 'active';
}

export function resolveEffectivePrice(
  priceBase: number | string,
  discount:
    | (DiscountWindowInput & { percentOff: number })
    | null
    | undefined,
  now: Date | string = new Date(),
): EffectivePriceResult {
  const base = roundMoney(toPriceNumber(priceBase));
  const fallback: EffectivePriceResult = {
    priceBase: base,
    priceSale: base,
    percentOff: null,
    isDiscounted: false,
  };

  if (!Number.isFinite(base) || base <= 0) {
    return fallback;
  }

  if (resolveDiscountStatus(discount, now) !== 'active' || !discount) {
    return fallback;
  }

  const sale = computeSalePrice(base, discount.percentOff);
  if (!Number.isFinite(sale) || sale < 0 || sale >= base) {
    return fallback;
  }

  return {
    priceBase: base,
    priceSale: sale,
    percentOff: discount.percentOff,
    isDiscounted: true,
  };
}

/** Format a money number as a fixed 2-decimal string (API-style). */
export function formatPriceAmount(value: number): string {
  return roundMoney(value).toFixed(2);
}

export type DiscountCountdownUnits = {
  days: number;
  hours: number;
  minutes: number;
  totalMs: number;
};

export function getDiscountCountdownUnits(
  endsAt: Date | string,
  now: Date | string | number = new Date(),
): DiscountCountdownUnits | null {
  const endMs = toDate(endsAt).getTime();
  const nowMs = typeof now === 'number' ? now : toDate(now).getTime();
  const remaining = endMs - nowMs;
  if (!Number.isFinite(remaining) || remaining <= 0) {
    return null;
  }
  const totalMinutes = Math.floor(remaining / (60 * 1000));
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  let minutes = totalMinutes % 60;
  if (days === 0 && hours === 0 && minutes === 0) {
    minutes = 1;
  }
  return {
    days,
    hours,
    minutes,
    totalMs: remaining,
  };
}

export function formatDiscountCountdown(
  endsAt: Date | string,
  now: Date | string | number = new Date(),
): string | null {
  const units = getDiscountCountdownUnits(endsAt, now);
  if (!units) {
    return null;
  }
  if (units.days > 0) {
    return `Ends in ${units.days}d ${units.hours}h`;
  }
  if (units.hours > 0) {
    return `Ends in ${units.hours}h ${units.minutes}m`;
  }
  return `Ends in ${Math.max(1, units.minutes)}m`;
}
