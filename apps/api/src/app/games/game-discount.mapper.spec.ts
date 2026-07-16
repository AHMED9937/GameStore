import { describe, expect, it } from 'vitest';
import {
  toAdminGameDiscountDto,
  toPublicGameDiscountDto,
} from './game-discount.mapper';

const now = new Date('2026-07-15T12:00:00.000Z');

const activeDiscount = {
  percentOff: 25,
  startsAt: '2026-07-14T00:00:00.000Z',
  endsAt: '2026-07-16T06:00:00.000Z',
  showCountdown: true,
  enabled: true,
};

describe('game-discount.mapper', () => {
  it('maps admin dto with status and duration parts', () => {
    const dto = toAdminGameDiscountDto(activeDiscount, '40.00', now);
    expect(dto).toMatchObject({
      percentOff: 25,
      priceSale: '30.00',
      status: 'active',
      durationDays: 2,
      durationHours: 6,
      showCountdown: true,
    });
  });

  it('maps public dto only when active', () => {
    expect(toPublicGameDiscountDto(activeDiscount, '40.00', now)).toEqual({
      percentOff: 25,
      priceSale: '30.00',
      endsAt: '2026-07-16T06:00:00.000Z',
      showCountdown: true,
    });

    expect(
      toPublicGameDiscountDto(
        { ...activeDiscount, enabled: false },
        '40.00',
        now,
      ),
    ).toBeNull();
  });

  it('keeps a 100% (free) promo visible in the public dto', () => {
    expect(
      toPublicGameDiscountDto(
        { ...activeDiscount, percentOff: 100 },
        '40.00',
        now,
      ),
    ).toEqual({
      percentOff: 100,
      priceSale: '0.00',
      endsAt: '2026-07-16T06:00:00.000Z',
      showCountdown: true,
    });
  });

  it('maps a 100% promo admin dto with a 0.00 sale price', () => {
    const dto = toAdminGameDiscountDto(
      { ...activeDiscount, percentOff: 100 },
      '40.00',
      now,
    );
    expect(dto).toMatchObject({
      percentOff: 100,
      priceSale: '0.00',
      status: 'active',
    });
  });
});
