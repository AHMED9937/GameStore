import { describe, expect, it } from 'vitest';
import { IgdbConfig } from './igdb.config';

describe('IgdbConfig', () => {
  it('returns setup response for search', () => {
    expect(IgdbConfig.getSetupResponse('search')).toEqual({
      status: 'setup',
      integration: 'igdb',
      message: 'IGDB search — not implemented yet',
    });
  });

  it('returns setup response for import', () => {
    expect(IgdbConfig.getSetupResponse('import')).toEqual({
      status: 'setup',
      integration: 'igdb',
      message: 'IGDB import — not implemented yet',
    });
  });
});
