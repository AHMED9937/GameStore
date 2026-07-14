import { describe, expect, it, vi } from 'vitest';
import type { AuditLogService } from '@gamestore/api/auth';
import { AdminGamesController } from './admin-games.controller';
import type { AdminGamesService } from './admin-games.service';

const sampleGame = {
  id: 'game-1',
  title: 'Demo Game',
  slug: 'demo-game',
  platform: 'steam',
  priceBase: '9.99',
  description: 'A demo title',
  coverImage: null,
  coverCardImage: null,
  publishedAt: null,
  published: false,
  soldOut: false,
  soldOutManual: false,
  featuredOrder: null,
  nextAccountId: null,
  igdbId: null,
  igdbSyncedAt: null,
  igdbCoverUrl: null,
  releaseDate: null,
  genres: [],
  requirementsMin: null,
  requirementsRecommended: null,
  media: [],
  accountSummary: { total: 0, active: 0, hasActivePool: false },
};

describe('AdminGamesController', () => {
  const adminGames = {
    findAll: vi.fn().mockResolvedValue([sampleGame]),
    findOne: vi.fn().mockResolvedValue(sampleGame),
    create: vi.fn().mockResolvedValue(sampleGame),
    update: vi.fn().mockResolvedValue({ ...sampleGame, published: true }),
    remove: vi.fn().mockResolvedValue({ id: 'game-1', deleted: true as const }),
    bulkUnpublish: vi.fn().mockResolvedValue({ succeeded: ['game-1'], failed: [] }),
    bulkDelete: vi.fn().mockResolvedValue({ succeeded: ['game-1'], failed: [] }),
    getReadiness: vi.fn().mockResolvedValue({
      ready: false,
      canPublish: false,
      checks: [],
    }),
    getFeaturedGames: vi.fn().mockResolvedValue({ featured: [], available: [] }),
    updateFeaturedGames: vi.fn().mockResolvedValue({ featured: [], available: [] }),
    setNextAccount: vi.fn().mockResolvedValue({
      ...sampleGame,
      nextAccountId: 'acct-1',
    }),
  } satisfies AdminGamesService;

  const igdbImport = {
    syncGame: vi.fn().mockResolvedValue({ game: sampleGame }),
  };

  const auditLogService = {
    log: vi.fn().mockResolvedValue(undefined),
  } satisfies AuditLogService;

  const controller = new AdminGamesController(
    adminGames,
    auditLogService,
    igdbImport as never,
  );
  const adminUser = { id: 'admin-1', clerkId: 'clerk-admin', role: 'admin' as const };
  const request = { headers: {}, ip: '127.0.0.1' };

  it('findAll returns admin games and forwards filters', async () => {
    const filters = { q: 'demo', platform: 'steam', status: 'published' as const };
    await expect(controller.findAll(filters)).resolves.toEqual([sampleGame]);
    expect(adminGames.findAll).toHaveBeenCalledWith(filters);
  });

  it('findAll returns admin games', async () => {
    await expect(controller.findAll({})).resolves.toEqual([sampleGame]);
    expect(adminGames.findAll).toHaveBeenCalledWith({});
  });

  it('findOne returns a game by id', async () => {
    await expect(controller.findOne('game-1')).resolves.toEqual(sampleGame);
    expect(adminGames.findOne).toHaveBeenCalledWith('game-1');
  });

  it('create records audit log', async () => {
    const body = {
      title: 'Demo Game',
      slug: 'demo-game',
      platform: 'steam',
      priceBase: 9.99,
    };

    await expect(controller.create(body, adminUser, request as never)).resolves.toEqual(
      sampleGame,
    );
    expect(adminGames.create).toHaveBeenCalledWith(body);
    expect(auditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'admin.game.create',
        resourceId: 'game-1',
      }),
    );
  });

  it('update records publish audit when published is true', async () => {
    await controller.update('game-1', { published: true }, adminUser, request as never);

    expect(auditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'admin.game.publish',
        resourceId: 'game-1',
      }),
    );
  });

  it('remove records delete audit', async () => {
    await expect(
      controller.remove('game-1', adminUser, request as never),
    ).resolves.toEqual({ id: 'game-1', deleted: true });
    expect(auditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'admin.game.delete',
        resourceId: 'game-1',
      }),
    );
  });

  it('bulkUnpublish records bulk audit', async () => {
    await controller.bulkUnpublish(
      { ids: ['game-1', 'game-2'] },
      adminUser,
      request as never,
    );
    expect(adminGames.bulkUnpublish).toHaveBeenCalledWith(['game-1', 'game-2']);
    expect(auditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'admin.game.bulk_unpublish',
      }),
    );
  });

  it('updateFeatured records featured audit', async () => {
    await controller.updateFeatured(
      { gameIds: ['game-1'] },
      adminUser,
      request as never,
    );

    expect(adminGames.updateFeaturedGames).toHaveBeenCalledWith(['game-1']);
    expect(auditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'admin.game.featured_update',
      }),
    );
  });
});
