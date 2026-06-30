import { describe, expect, it, vi } from 'vitest';
import { AdminIgdbController } from './admin-igdb.controller';
import type { IgdbService } from '@gamestore/api/igdb';

const setupBody = {
  status: 'setup' as const,
  integration: 'igdb',
  message: 'IGDB search — not implemented yet',
};

describe('AdminIgdbController', () => {
  const igdb = {
    health: vi.fn(),
    search: vi.fn().mockReturnValue(setupBody),
    importGame: vi.fn().mockReturnValue({
      ...setupBody,
      message: 'IGDB import — not implemented yet',
    }),
  } satisfies IgdbService;

  const controller = new AdminIgdbController(igdb);

  it('search delegates to IgdbService', () => {
    expect(controller.search('halo')).toEqual(setupBody);
    expect(igdb.search).toHaveBeenCalledWith('halo');
  });

  it('importGame delegates to IgdbService', () => {
    const result = controller.importGame({ igdbId: 42 });
    expect(result.message).toBe('IGDB import — not implemented yet');
    expect(igdb.importGame).toHaveBeenCalledWith(42);
  });
});
