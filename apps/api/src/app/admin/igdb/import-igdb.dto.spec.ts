import { describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { parseImportIgdbBody } from './import-igdb.dto';

describe('parseImportIgdbBody', () => {
  it('parses valid body with defaults', () => {
    expect(parseImportIgdbBody({ igdbId: 42 })).toEqual({
      igdbId: 42,
      priceBase: 9.99,
      platform: 'steam',
      slug: undefined,
    });
  });

  it('parses optional fields', () => {
    expect(
      parseImportIgdbBody({
        igdbId: '99',
        priceBase: '19.99',
        platform: 'epic',
        slug: 'my-game',
      }),
    ).toEqual({
      igdbId: 99,
      priceBase: 19.99,
      platform: 'epic',
      slug: 'my-game',
    });
  });

  it('rejects missing igdbId', () => {
    expect(() => parseImportIgdbBody({})).toThrow(BadRequestException);
  });

  it('rejects invalid platform', () => {
    expect(() =>
      parseImportIgdbBody({ igdbId: 1, platform: 'xbox' }),
    ).toThrow(BadRequestException);
  });

  it('rejects negative priceBase', () => {
    expect(() => parseImportIgdbBody({ igdbId: 1, priceBase: -1 })).toThrow(
      BadRequestException,
    );
  });
});
