import { describe, expect, it } from 'vitest';
import {
  formatDiscountCountdown,
  formatGamePrice,
  resolveActiveGameDiscount,
} from './games.api';

describe('formatGamePrice', () => {
  it('shows Free for a zero sale price', () => {
    expect(formatGamePrice('0.00')).toBe('Free');
    expect(formatGamePrice('0')).toBe('Free');
  });

  it('formats a positive price as USD currency', () => {
    expect(formatGamePrice('19.99')).toBe('$19.99');
  });
});

describe('resolveActiveGameDiscount', () => {
  it('returns null when endsAt has passed', () => {
    expect(
      resolveActiveGameDiscount(
        {
          discount: {
            percentOff: 10,
            priceSale: '8.99',
            endsAt: '2020-01-01T00:00:00.000Z',
            showCountdown: true,
          },
        },
        Date.parse('2026-07-15T00:00:00.000Z'),
      ),
    ).toBeNull();
  });

  it('returns discount while still active', () => {
    const discount = {
      percentOff: 10,
      priceSale: '8.99',
      endsAt: '2099-01-01T00:00:00.000Z',
      showCountdown: true,
    };
    expect(resolveActiveGameDiscount({ discount })).toEqual(discount);
  });
});

describe('formatDiscountCountdown', () => {
  it('formats remaining days and hours', () => {
    expect(
      formatDiscountCountdown(
        '2026-07-17T14:00:00.000Z',
        Date.parse('2026-07-15T12:00:00.000Z'),
      ),
    ).toBe('Ends in 2d 2h');
  });
});
