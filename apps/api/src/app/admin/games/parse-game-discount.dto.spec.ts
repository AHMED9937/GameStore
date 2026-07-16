import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { parseUpsertGameDiscountBody } from './parse-game-discount.dto';

describe('parseUpsertGameDiscountBody', () => {
  it('parses a valid percentage discount with duration', () => {
    expect(
      parseUpsertGameDiscountBody(
        {
          percentOff: 25,
          durationDays: 2,
          durationHours: 4,
          showCountdown: true,
          enabled: true,
        },
        '19.99',
      ),
    ).toEqual({
      percentOff: 25,
      durationDays: 2,
      durationHours: 4,
      showCountdown: true,
      enabled: true,
    });
  });

  it('rejects invalid percentOff', () => {
    expect(() =>
      parseUpsertGameDiscountBody({ percentOff: 0, durationDays: 1 }, '9.99'),
    ).toThrow(BadRequestException);
    expect(() =>
      parseUpsertGameDiscountBody({ percentOff: 101, durationHours: 1 }, '9.99'),
    ).toThrow(BadRequestException);
  });

  it('rejects empty duration', () => {
    expect(() =>
      parseUpsertGameDiscountBody(
        { percentOff: 10, durationDays: 0, durationHours: 0 },
        '9.99',
      ),
    ).toThrow(/duration/i);
  });

  it('accepts a 100% discount as a free game (zero sale price)', () => {
    expect(
      parseUpsertGameDiscountBody(
        { percentOff: 100, durationDays: 1 },
        '19.99',
      ),
    ).toEqual({
      percentOff: 100,
      durationDays: 1,
      durationHours: 0,
      showCountdown: true,
      enabled: true,
    });
  });
});
