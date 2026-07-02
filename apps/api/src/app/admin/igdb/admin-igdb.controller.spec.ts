import { describe, expect, it, vi } from 'vitest';
import type { AuditLogService } from '@gamestore/api/auth';
import { AdminIgdbController } from './admin-igdb.controller';
import type { AdminIgdbImportService } from './admin-igdb-import.service';
import type { IgdbService } from '@gamestore/api/igdb';

const setupBody = {
  status: 'setup' as const,
  integration: 'igdb',
  message: 'IGDB search — not implemented yet',
};

describe('AdminIgdbController', () => {
  const igdb = {
    health: vi.fn(),
    search: vi.fn().mockResolvedValue(setupBody),
  } satisfies Pick<IgdbService, 'health' | 'search'>;

  const igdbImport = {
    importGame: vi.fn().mockResolvedValue({
      ...setupBody,
      message: 'IGDB import — not implemented yet',
    }),
  } satisfies AdminIgdbImportService;

  const auditLogService = {
    log: vi.fn().mockResolvedValue(undefined),
  } satisfies AuditLogService;

  const controller = new AdminIgdbController(
    igdb as IgdbService,
    igdbImport,
    auditLogService,
  );
  const adminUser = { id: 'admin-1', clerkId: 'clerk-admin', role: 'admin' as const };

  it('search delegates to IgdbService', async () => {
    await expect(controller.search('halo')).resolves.toEqual(setupBody);
    expect(igdb.search).toHaveBeenCalledWith('halo');
  });

  it('importGame delegates to AdminIgdbImportService with defaults', async () => {
    const request = { headers: {}, ip: '127.0.0.1' };
    const result = await controller.importGame({ igdbId: 42 }, adminUser, request as never);

    expect(result).toEqual({
      ...setupBody,
      message: 'IGDB import — not implemented yet',
    });
    expect(igdbImport.importGame).toHaveBeenCalledWith({
      igdbId: 42,
      priceBase: 9.99,
      platform: 'steam',
      slug: undefined,
    });
    expect(auditLogService.log).not.toHaveBeenCalled();
  });

  it('records audit log when import succeeds', async () => {
    igdbImport.importGame.mockResolvedValueOnce({
      game: {
        id: 'game-1',
        slug: 'halo',
        title: 'Halo',
        igdbId: 42,
        platform: 'steam',
        priceBase: '9.99',
        publishedAt: null,
      },
    });

    const request = {
      headers: { 'user-agent': 'vitest' },
      ip: '127.0.0.1',
    };

    await controller.importGame(
      { igdbId: 42, priceBase: 19.99, platform: 'steam', slug: 'halo' },
      adminUser,
      request as never,
    );

    expect(auditLogService.log).toHaveBeenCalledWith({
      userId: 'admin-1',
      action: 'admin.igdb.import',
      resource: 'game',
      resourceId: 'game-1',
      ip: '127.0.0.1',
      userAgent: 'vitest',
      metadata: {
        igdbId: 42,
        slug: 'halo',
      },
    });
  });
});
