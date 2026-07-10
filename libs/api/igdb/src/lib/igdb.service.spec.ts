import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { IgdbService } from './igdb.service';

describe('IgdbService', () => {
  const originalClientId = process.env['IGDB_CLIENT_ID'];
  const originalClientSecret = process.env['IGDB_CLIENT_SECRET'];

  beforeEach(() => {
    delete process.env['IGDB_CLIENT_ID'];
    delete process.env['IGDB_CLIENT_SECRET'];
  });

  afterEach(() => {
    if (originalClientId === undefined) {
      delete process.env['IGDB_CLIENT_ID'];
    } else {
      process.env['IGDB_CLIENT_ID'] = originalClientId;
    }
    if (originalClientSecret === undefined) {
      delete process.env['IGDB_CLIENT_SECRET'];
    } else {
      process.env['IGDB_CLIENT_SECRET'] = originalClientSecret;
    }
  });

  it('search returns setup JSON when credentials are missing', async () => {
    const service = new IgdbService();

    await expect(service.search('halo')).resolves.toEqual({
      status: 'setup',
      integration: 'igdb',
      message:
        'IGDB search is not configured. Set IGDB_CLIENT_ID and IGDB_CLIENT_SECRET in .env and restart the API.',
    });
  });
});
