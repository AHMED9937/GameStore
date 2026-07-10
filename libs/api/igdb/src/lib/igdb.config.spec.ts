import { describe, expect, it } from 'vitest';
import { IgdbConfig } from './igdb.config';

describe('IgdbConfig', () => {
  it('returns setup response for search', () => {
    expect(IgdbConfig.getSetupResponse('search')).toEqual({
      status: 'setup',
      integration: 'igdb',
      message:
        'IGDB search is not configured. Set IGDB_CLIENT_ID and IGDB_CLIENT_SECRET in .env and restart the API.',
    });
  });

  it('returns setup response for import', () => {
    expect(IgdbConfig.getSetupResponse('import')).toEqual({
      status: 'setup',
      integration: 'igdb',
      message:
        'IGDB import is not configured. Set IGDB_CLIENT_ID and IGDB_CLIENT_SECRET in .env and restart the API.',
    });
  });
});
