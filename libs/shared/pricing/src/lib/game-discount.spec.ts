import {
  computeEndsAt,
  computeSalePrice,
  formatPriceAmount,
  getDiscountCountdownUnits,
  isValidDiscountDuration,
  resolveDiscountStatus,
  resolveEffectivePrice,
  roundMoney,
} from './game-discount';

describe('roundMoney', () => {
  it('rounds half-up to cents', () => {
    expect(roundMoney(19.994)).toBe(19.99);
    expect(roundMoney(19.995)).toBe(20);
    expect(roundMoney(10.1)).toBe(10.1);
  });
});

describe('computeSalePrice', () => {
  it('applies percent off with cent rounding', () => {
    expect(computeSalePrice(59.99, 30)).toBe(41.99);
    expect(computeSalePrice('10.00', 25)).toBe(7.5);
    expect(computeSalePrice(9.99, 10)).toBe(8.99);
  });

  it('rejects invalid percent or base', () => {
    expect(computeSalePrice(10, 0)).toBeNaN();
    expect(computeSalePrice(10, 101)).toBeNaN();
    expect(computeSalePrice(10, 12.5)).toBeNaN();
    expect(computeSalePrice(0, 20)).toBeNaN();
    expect(computeSalePrice(-5, 20)).toBeNaN();
    expect(computeSalePrice('abc', 20)).toBeNaN();
  });

  it('allows a 100% discount to reach a zero sale price', () => {
    expect(computeSalePrice(10, 100)).toBe(0);
    expect(computeSalePrice(59.99, 100)).toBe(0);
    expect(computeSalePrice(0.01, 99)).toBe(0);
  });
});

describe('computeEndsAt / isValidDiscountDuration', () => {
  it('adds days and hours', () => {
    const start = new Date('2026-07-15T12:00:00.000Z');
    expect(computeEndsAt(start, { days: 1, hours: 2 }).toISOString()).toBe(
      '2026-07-16T14:00:00.000Z',
    );
    expect(computeEndsAt(start, { days: 0, hours: 6 }).toISOString()).toBe(
      '2026-07-15T18:00:00.000Z',
    );
  });

  it('validates duration requires at least one positive unit', () => {
    expect(isValidDiscountDuration({ days: 0, hours: 0 })).toBe(false);
    expect(isValidDiscountDuration({ days: 1, hours: 0 })).toBe(true);
    expect(isValidDiscountDuration({ days: 0, hours: 3 })).toBe(true);
    expect(isValidDiscountDuration({ days: -1, hours: 5 })).toBe(false);
  });
});

describe('resolveDiscountStatus', () => {
  const now = new Date('2026-07-15T12:00:00.000Z');

  it('returns none for missing discount', () => {
    expect(resolveDiscountStatus(null, now)).toBe('none');
    expect(resolveDiscountStatus(undefined, now)).toBe('none');
  });

  it('returns disabled when enabled is false', () => {
    expect(
      resolveDiscountStatus(
        {
          enabled: false,
          startsAt: '2026-07-14T00:00:00.000Z',
          endsAt: '2026-07-20T00:00:00.000Z',
        },
        now,
      ),
    ).toBe('disabled');
  });

  it('returns scheduled / active / expired by window', () => {
    const window = {
      enabled: true,
      startsAt: '2026-07-15T10:00:00.000Z',
      endsAt: '2026-07-16T10:00:00.000Z',
    };
    expect(resolveDiscountStatus(window, '2026-07-15T09:00:00.000Z')).toBe(
      'scheduled',
    );
    expect(resolveDiscountStatus(window, now)).toBe('active');
    expect(resolveDiscountStatus(window, '2026-07-16T10:00:00.000Z')).toBe(
      'expired',
    );
  });
});

describe('resolveEffectivePrice', () => {
  const now = new Date('2026-07-15T12:00:00.000Z');
  const activeDiscount = {
    enabled: true,
    percentOff: 20,
    startsAt: '2026-07-14T00:00:00.000Z',
    endsAt: '2026-07-20T00:00:00.000Z',
  };

  it('returns discounted price when active', () => {
    expect(resolveEffectivePrice(19.99, activeDiscount, now)).toEqual({
      priceBase: 19.99,
      priceSale: 15.99,
      percentOff: 20,
      isDiscounted: true,
    });
  });

  it('treats a 100% discount as an active free sale price', () => {
    expect(
      resolveEffectivePrice(19.99, { ...activeDiscount, percentOff: 100 }, now),
    ).toEqual({
      priceBase: 19.99,
      priceSale: 0,
      percentOff: 100,
      isDiscounted: true,
    });
  });

  it('falls back to base when inactive', () => {
    expect(
      resolveEffectivePrice(19.99, { ...activeDiscount, enabled: false }, now),
    ).toEqual({
      priceBase: 19.99,
      priceSale: 19.99,
      percentOff: null,
      isDiscounted: false,
    });
  });

  it('formats money strings via formatPriceAmount', () => {
    expect(formatPriceAmount(7.5)).toBe('7.50');
    expect(formatPriceAmount(15.99)).toBe('15.99');
  });
});

describe('getDiscountCountdownUnits', () => {
  it('splits remaining time into day/hour/minute tiles', () => {
    expect(
      getDiscountCountdownUnits(
        '2026-07-17T14:00:00.000Z',
        '2026-07-15T12:00:00.000Z',
      ),
    ).toEqual({
      days: 2,
      hours: 2,
      minutes: 0,
      totalMs: 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000,
    });
  });
});
