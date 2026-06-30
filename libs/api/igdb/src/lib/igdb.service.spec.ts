import { describe, expect, it } from 'vitest';
import { IgdbService } from './igdb.service';

describe('IgdbService', () => {
  const service = new IgdbService();

  it('search returns setup JSON', () => {
    expect(service.search('halo')).toEqual({
      status: 'setup',
      integration: 'igdb',
      message: 'IGDB search — not implemented yet',
    });
  });

  it('importGame returns setup JSON', () => {
    expect(service.importGame(12345)).toEqual({
      status: 'setup',
      integration: 'igdb',
      message: 'IGDB import — not implemented yet',
    });
  });
});
