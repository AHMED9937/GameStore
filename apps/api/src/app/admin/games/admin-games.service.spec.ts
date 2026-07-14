import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GamesRepository, StoreSettingsRepository } from '@gamestore/api/data-access';
import type { PrismaService } from '@gamestore/api/prisma';
import type { EntitlementCleanupService } from '../../entitlements/entitlement-cleanup.service';
import type { DiscordNotifyService } from '../../discord/discord-notify.service';
import { AdminGamesService } from './admin-games.service';

const sampleGame = {
  id: 'game-1',
  title: 'Demo Game',
  slug: 'demo-game',
  platform: 'steam',
  priceBase: { toString: () => '9.99' },
  description: 'A demo title',
  coverImage: null,
  coverCardImage: null,
  metaTitle: null,
  metaDescription: null,
  ogImage: null,
  publishedAt: new Date('2026-01-01'),
  igdbId: null,
  igdbSyncedAt: null,
  igdbCoverUrl: null,
  releaseDate: null,
  genres: [],
  requirementsMin: null,
  requirementsRecommended: null,
  featuredOrder: null,
  soldOut: false,
  discordPublishMessageId: null,
  discordAnnounceDescription: null,
  media: [],
};

function createDiscordNotify(): DiscordNotifyService {
  return {
    publishGameAnnouncement: vi.fn().mockResolvedValue('msg-new'),
    updateGameAnnouncement: vi.fn().mockResolvedValue(true),
    deleteGameAnnouncement: vi.fn().mockResolvedValue(true),
    isWebhookConfigured: vi.fn().mockReturnValue(true),
  } as unknown as DiscordNotifyService;
}

function withDiscordRepositoryMocks(
  games: GamesRepository,
): GamesRepository {
  Object.assign(games, {
    getDiscordAnnouncementState: vi.fn().mockResolvedValue({
      discordPublishMessageId: null,
      discordAnnounceDescription: null,
    }),
    setDiscordPublishMessageId: vi.fn().mockResolvedValue(undefined),
    setDiscordAnnounceDescription: vi.fn().mockResolvedValue(undefined),
  });
  return games;
}

describe('AdminGamesService bulk actions', () => {
  const games = withDiscordRepositoryMocks({
    findAllAdmin: vi.fn(),
    findByIdAdmin: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  } as unknown as GamesRepository);

  const prisma = {
    gameAccount: {
      count: vi.fn().mockResolvedValue(0),
      findMany: vi.fn().mockResolvedValue([]),
    },
  } as unknown as PrismaService;

  const entitlementCleanup = {
    revokeAllLicensesForGame: vi.fn().mockResolvedValue(0),
    prepareGameForDeletion: vi.fn().mockResolvedValue({
      revokedLicenses: 0,
      deletedOrders: 0,
      snapshottedOrders: 0,
    }),
  } satisfies Pick<
    EntitlementCleanupService,
    'revokeAllLicensesForGame' | 'prepareGameForDeletion'
  >;

  const storeSettings = {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn(),
    delete: vi.fn(),
  } as unknown as StoreSettingsRepository;

  let service: AdminGamesService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AdminGamesService(
      games,
      prisma,
      entitlementCleanup as EntitlementCleanupService,
      storeSettings,
      createDiscordNotify(),
    );
    vi.mocked(games.findByIdAdmin).mockResolvedValue(sampleGame as never);
    vi.mocked(games.update).mockResolvedValue(sampleGame as never);
    vi.mocked(games.delete).mockResolvedValue(sampleGame as never);
  });

  it('bulkUnpublish revokes licenses before unpublishing', async () => {
    await expect(service.bulkUnpublish(['game-1', 'game-2'])).resolves.toEqual({
      succeeded: ['game-1', 'game-2'],
      failed: [],
    });
    expect(entitlementCleanup.revokeAllLicensesForGame).toHaveBeenCalledTimes(2);
    expect(games.update).toHaveBeenCalledTimes(2);
  });

  it('bulkDelete prepares game then deletes', async () => {
    const result = await service.bulkDelete(['game-1']);

    expect(result.succeeded).toEqual(['game-1']);
    expect(entitlementCleanup.prepareGameForDeletion).toHaveBeenCalledWith('game-1');
    expect(games.delete).toHaveBeenCalledWith('game-1');
  });

  it('bulkDelete collects failures', async () => {
    vi.mocked(games.delete)
      .mockResolvedValueOnce(sampleGame as never)
      .mockRejectedValueOnce({ code: 'P2025' });

    const result = await service.bulkDelete(['game-1', 'missing']);

    expect(result.succeeded).toEqual(['game-1']);
    expect(result.failed).toHaveLength(1);
  });
});

describe('AdminGamesService findAll', () => {
  const games = {
    findAllAdmin: vi.fn(),
    findByIdAdmin: vi.fn(),
  } as unknown as GamesRepository;

  const prisma = {
    gameAccount: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  } as unknown as PrismaService;

  const entitlementCleanup = {
    revokeAllLicensesForGame: vi.fn(),
    prepareGameForDeletion: vi.fn(),
  } as unknown as EntitlementCleanupService;

  const storeSettings = {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn(),
    delete: vi.fn(),
  } as unknown as StoreSettingsRepository;

  let service: AdminGamesService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AdminGamesService(
      games,
      prisma,
      entitlementCleanup,
      storeSettings,
      createDiscordNotify(),
    );
  });

  it('batches account summaries instead of per-game count queries', async () => {
    vi.mocked(games.findAllAdmin).mockResolvedValue([
      { ...sampleGame, id: 'game-1' },
      { ...sampleGame, id: 'game-2' },
    ] as never);
    vi.mocked(prisma.gameAccount.findMany).mockResolvedValue([
      { gameId: 'game-1', isActive: true },
      { gameId: 'game-1', isActive: false },
      { gameId: 'game-2', isActive: false },
    ] as never);

    const result = await service.findAll();

    expect(prisma.gameAccount.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.gameAccount.count).not.toHaveBeenCalled();
    expect(result).toHaveLength(2);
    expect(result[0]?.accountSummary).toEqual({
      total: 2,
      active: 1,
      hasActivePool: true,
    });
    expect(result[1]?.accountSummary).toEqual({
      total: 1,
      active: 0,
      hasActivePool: false,
    });
  });

  it('normalizes and forwards list filters', async () => {
    vi.mocked(games.findAllAdmin).mockResolvedValue([]);
    vi.mocked(prisma.gameAccount.findMany).mockResolvedValue([]);

    await service.findAll({
      q: '  Demo ',
      platform: ' Steam ',
      status: 'published',
    });

    expect(games.findAllAdmin).toHaveBeenCalledWith({
      q: 'Demo',
      platform: 'Steam',
      status: 'published',
    });
  });
});

describe('AdminGamesService featured games', () => {
  const games = withDiscordRepositoryMocks({
    findPublishedEligibleForFeatured: vi.fn(),
    setFeaturedOrder: vi.fn(),
    findByIdAdmin: vi.fn(),
    update: vi.fn(),
  } as unknown as GamesRepository);

  const prisma = {
    game: {
      findMany: vi.fn(),
    },
    gameAccount: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  } as unknown as PrismaService;

  const entitlementCleanup = {
    revokeAllLicensesForGame: vi.fn(),
    prepareGameForDeletion: vi.fn(),
  } as unknown as EntitlementCleanupService;

  const storeSettings = {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn(),
    delete: vi.fn(),
  } as unknown as StoreSettingsRepository;

  let service: AdminGamesService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AdminGamesService(
      games,
      prisma,
      entitlementCleanup,
      storeSettings,
      createDiscordNotify(),
    );
  });

  it('updateFeaturedGames rejects more than five ids', async () => {
    await expect(
      service.updateFeaturedGames(['1', '2', '3', '4', '5', '6']),
    ).rejects.toThrow('At most 5 games can be featured');
  });

  it('updateFeaturedGames rejects unpublished games', async () => {
    vi.mocked(prisma.game.findMany).mockResolvedValue([
      { id: 'g1', publishedAt: null },
    ] as never);

    await expect(service.updateFeaturedGames(['g1'])).rejects.toThrow(
      'Only published games can be featured',
    );
  });

  it('updateFeaturedGames assigns order and returns featured list', async () => {
    vi.mocked(prisma.game.findMany).mockResolvedValue([
      { id: 'g1', publishedAt: new Date() },
      { id: 'g2', publishedAt: new Date() },
    ] as never);
    vi.mocked(games.setFeaturedOrder).mockResolvedValue(undefined);
    vi.mocked(games.findPublishedEligibleForFeatured).mockResolvedValue([
      {
        id: 'g1',
        title: 'Alpha',
        slug: 'alpha',
        platform: 'steam',
        priceBase: { toString: () => '9.99' },
        coverImage: '/a.png',
        coverCardImage: null,
        featuredOrder: 1,
        releaseDate: new Date('2026-01-01'),
      },
      {
        id: 'g2',
        title: 'Beta',
        slug: 'beta',
        platform: 'steam',
        priceBase: { toString: () => '14.99' },
        coverImage: '/b.png',
        coverCardImage: null,
        featuredOrder: 2,
        releaseDate: new Date('2026-02-01'),
      },
    ] as never);

    const result = await service.updateFeaturedGames(['g1', 'g2']);

    expect(games.setFeaturedOrder).toHaveBeenCalledWith([
      { id: 'g1', featuredOrder: 1 },
      { id: 'g2', featuredOrder: 2 },
    ]);
    expect(result.featured).toHaveLength(2);
    expect(result.featured[0]?.slug).toBe('alpha');
  });

  it('unpublishing clears featuredOrder', async () => {
    vi.mocked(games.findByIdAdmin).mockResolvedValue({
      ...sampleGame,
      featuredOrder: 1,
      coverCardImage: null,
    } as never);
    vi.mocked(games.update).mockResolvedValue({
      ...sampleGame,
      publishedAt: null,
      featuredOrder: null,
    } as never);
    vi.mocked(prisma.gameAccount.count).mockResolvedValue(1);

    await service.update('game-1', { published: false });

    expect(games.update).toHaveBeenCalledWith(
      'game-1',
      expect.objectContaining({
        publishedAt: null,
        featuredOrder: null,
      }),
    );
  });
});

describe('AdminGamesService getReadiness', () => {
  const games = {
    findByIdAdmin: vi.fn(),
  } as unknown as GamesRepository;

  const prisma = {
    gameAccount: {
      count: vi.fn().mockResolvedValue(1),
      findMany: vi.fn().mockResolvedValue([{ isActive: true }]),
    },
  } as unknown as PrismaService;

  const entitlementCleanup = {
    revokeAllLicensesForGame: vi.fn(),
    prepareGameForDeletion: vi.fn(),
  } as unknown as EntitlementCleanupService;

  const storeSettings = {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  } as unknown as StoreSettingsRepository;

  const service = new AdminGamesService(
    games,
    prisma,
    entitlementCleanup,
    storeSettings,
    createDiscordNotify(),
  );

  it('passes activation check when store default is configured', async () => {
    vi.mocked(games.findByIdAdmin).mockResolvedValue({
      ...sampleGame,
      description: 'A'.repeat(50),
      coverImage: '/cover.png',
      genres: ['Action'],
      priceBase: { toString: () => '9.99' },
      media: [],
    } as never);
    vi.mocked(storeSettings.get).mockResolvedValue(
      'https://www.youtube.com/embed/default',
    );

    const readiness = await service.getReadiness('game-1');
    const activationCheck = readiness.checks.find((check) => check.id === 'activation');

    expect(activationCheck?.passed).toBe(true);
  });
});

describe('AdminGamesService soldOut', () => {
  const games = withDiscordRepositoryMocks({
    findByIdAdmin: vi.fn(),
    update: vi.fn(),
  } as unknown as GamesRepository);

  const prisma = {
    gameAccount: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  } as unknown as PrismaService;

  const entitlementCleanup = {
    revokeAllLicensesForGame: vi.fn(),
    prepareGameForDeletion: vi.fn(),
  } as unknown as EntitlementCleanupService;

  const storeSettings = {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn(),
    delete: vi.fn(),
  } as unknown as StoreSettingsRepository;

  let service: AdminGamesService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AdminGamesService(
      games,
      prisma,
      entitlementCleanup,
      storeSettings,
      createDiscordNotify(),
    );
    vi.mocked(games.update).mockResolvedValue(sampleGame as never);
  });

  it('computes effective soldOut when no active pool exists', async () => {
    vi.mocked(games.findByIdAdmin).mockResolvedValue({
      ...sampleGame,
      soldOut: false,
    } as never);
    vi.mocked(prisma.gameAccount.count)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    const result = await service.findOne('game-1');

    expect(result.soldOutManual).toBe(false);
    expect(result.soldOut).toBe(true);
  });

  it('rejects clearing manual soldOut without an active pool', async () => {
    vi.mocked(games.findByIdAdmin).mockResolvedValue({
      ...sampleGame,
      soldOut: true,
    } as never);
    vi.mocked(prisma.gameAccount.count)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    await expect(service.update('game-1', { soldOut: false })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('persists manual soldOut toggle', async () => {
    vi.mocked(games.findByIdAdmin)
      .mockResolvedValueOnce({
        ...sampleGame,
        soldOut: false,
      } as never)
      .mockResolvedValueOnce({
        ...sampleGame,
        soldOut: true,
      } as never);
    vi.mocked(prisma.gameAccount.count).mockResolvedValue(1);

    await service.update('game-1', { soldOut: true });

    expect(games.update).toHaveBeenCalledWith(
      'game-1',
      expect.objectContaining({ soldOut: true }),
    );
  });
});

describe('AdminGamesService Discord publish notify', () => {
  const games = withDiscordRepositoryMocks({
    findByIdAdmin: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  } as unknown as GamesRepository);

  const prisma = {
    gameAccount: {
      count: vi.fn().mockResolvedValue(1),
      findMany: vi.fn().mockResolvedValue([]),
    },
    gameMedia: {
      count: vi.fn().mockResolvedValue(1),
    },
    game: {
      update: vi.fn().mockResolvedValue({}),
    },
  } as unknown as PrismaService;

  const entitlementCleanup = {
    revokeAllLicensesForGame: vi.fn(),
    prepareGameForDeletion: vi.fn(),
  } as unknown as EntitlementCleanupService;

  const storeSettings = {
    get: vi.fn().mockResolvedValue(null),
  } as unknown as StoreSettingsRepository;

  let discordNotify: DiscordNotifyService;
  let service: AdminGamesService;

  beforeEach(() => {
    vi.clearAllMocks();
    discordNotify = createDiscordNotify();
    vi.mocked(games.getDiscordAnnouncementState).mockResolvedValue({
      discordPublishMessageId: null,
      discordAnnounceDescription: null,
    });
    service = new AdminGamesService(
      games,
      prisma,
      entitlementCleanup,
      storeSettings,
      discordNotify,
    );
  });

  it('publishes to Discord and stores message id on unpublished → published transition', async () => {
    const draft = { ...sampleGame, publishedAt: null, coverImage: 'https://cdn/x.jpg' };
    const published = { ...sampleGame, publishedAt: new Date('2026-07-10') };
    vi.mocked(games.findByIdAdmin)
      .mockResolvedValueOnce(draft as never)
      .mockResolvedValueOnce(published as never)
      .mockResolvedValueOnce(published as never);
    vi.mocked(games.update).mockResolvedValue(published as never);
    vi.spyOn(service, 'getReadiness').mockResolvedValue({
      canPublish: true,
      checks: [],
    } as never);

    await service.update('game-1', { published: true });

    expect(discordNotify.publishGameAnnouncement).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Demo Game',
        slug: 'demo-game',
        platform: 'steam',
      }),
    );
    expect(games.setDiscordPublishMessageId).toHaveBeenCalledWith(
      'game-1',
      'msg-new',
    );
  });

  it('does not publish when game was already published and no embed fields change', async () => {
    vi.mocked(games.findByIdAdmin).mockResolvedValue(sampleGame as never);
    vi.mocked(games.update).mockResolvedValue(sampleGame as never);

    await service.update('game-1', { description: 'Longer description for the catalog page only' });

    expect(discordNotify.publishGameAnnouncement).not.toHaveBeenCalled();
    expect(discordNotify.updateGameAnnouncement).not.toHaveBeenCalled();
  });

  it('updates Discord when published game embed fields change', async () => {
    vi.mocked(games.getDiscordAnnouncementState).mockResolvedValue({
      discordPublishMessageId: 'msg-existing',
      discordAnnounceDescription: null,
    });
    const published = { ...sampleGame, publishedAt: new Date('2026-01-01') };
    vi.mocked(games.findByIdAdmin)
      .mockResolvedValueOnce(published as never)
      .mockResolvedValueOnce({ ...published, title: 'Renamed' } as never)
      .mockResolvedValueOnce({ ...published, title: 'Renamed' } as never);
    vi.mocked(games.update).mockResolvedValue(published as never);

    await service.update('game-1', { title: 'Renamed' });

    expect(discordNotify.updateGameAnnouncement).toHaveBeenCalledWith(
      'msg-existing',
      expect.objectContaining({ title: 'Renamed' }),
    );
  });

  it('updates Discord when sold out is toggled on a published game', async () => {
    vi.mocked(games.getDiscordAnnouncementState).mockResolvedValue({
      discordPublishMessageId: 'msg-existing',
      discordAnnounceDescription: null,
    });
    const published = { ...sampleGame, publishedAt: new Date('2026-01-01') };
    const soldOut = { ...published, soldOut: true };
    let findCalls = 0;
    vi.mocked(games.findByIdAdmin).mockImplementation(async () => {
      findCalls += 1;
      return (findCalls === 1 ? published : soldOut) as never;
    });
    vi.mocked(games.update).mockResolvedValue(soldOut as never);

    await service.update('game-1', { soldOut: true });

    expect(discordNotify.updateGameAnnouncement).toHaveBeenCalledWith(
      'msg-existing',
      expect.objectContaining({ soldOut: true }),
    );
  });

  it('deletes Discord message on unpublish', async () => {
    const published = {
      ...sampleGame,
      publishedAt: new Date('2026-01-01'),
    };
    const draft = { ...sampleGame, publishedAt: null };
    vi.mocked(games.getDiscordAnnouncementState).mockResolvedValue({
      discordPublishMessageId: 'msg-existing',
      discordAnnounceDescription: null,
    });
    vi.mocked(games.findByIdAdmin)
      .mockResolvedValueOnce(published as never)
      .mockResolvedValue(draft as never);
    vi.mocked(games.update).mockResolvedValue(draft as never);

    await service.update('game-1', { published: false });

    expect(games.update).toHaveBeenCalled();
    expect(discordNotify.deleteGameAnnouncement).toHaveBeenCalledWith('msg-existing');
    expect(games.setDiscordPublishMessageId).toHaveBeenCalledWith('game-1', null);
    const updateOrder = vi.mocked(games.update).mock.invocationCallOrder[0];
    const deleteOrder = vi.mocked(discordNotify.deleteGameAnnouncement).mock
      .invocationCallOrder[0];
    expect(updateOrder).toBeLessThan(deleteOrder);
  });

  it('keeps discordPublishMessageId when Discord delete fails on unpublish', async () => {
    const published = {
      ...sampleGame,
      publishedAt: new Date('2026-01-01'),
    };
    const draft = { ...sampleGame, publishedAt: null };
    vi.mocked(games.getDiscordAnnouncementState).mockResolvedValue({
      discordPublishMessageId: 'msg-existing',
      discordAnnounceDescription: null,
    });
    vi.mocked(games.findByIdAdmin)
      .mockResolvedValueOnce(published as never)
      .mockResolvedValue(draft as never);
    vi.mocked(games.update).mockResolvedValue(draft as never);
    vi.mocked(discordNotify.deleteGameAnnouncement).mockResolvedValue(false);

    await service.update('game-1', { published: false });

    expect(discordNotify.deleteGameAnnouncement).toHaveBeenCalledWith('msg-existing');
    expect(games.setDiscordPublishMessageId).not.toHaveBeenCalled();
  });

  it('updates Discord when coverCardImage changes on a published game', async () => {
    vi.mocked(games.getDiscordAnnouncementState).mockResolvedValue({
      discordPublishMessageId: 'msg-existing',
      discordAnnounceDescription: null,
    });
    const published = { ...sampleGame, publishedAt: new Date('2026-01-01') };
    const withCard = {
      ...published,
      coverCardImage: 'https://cdn.example/card.jpg',
    };
    vi.mocked(games.findByIdAdmin)
      .mockResolvedValueOnce(published as never)
      .mockResolvedValue(withCard as never);
    vi.mocked(games.update).mockResolvedValue(withCard as never);

    await service.update('game-1', {
      coverCardImage: 'https://cdn.example/card.jpg',
    });

    expect(discordNotify.updateGameAnnouncement).toHaveBeenCalledWith(
      'msg-existing',
      expect.objectContaining({
        coverUrl: 'https://cdn.example/card.jpg',
      }),
    );
  });

  it('deletes Discord message before removing a game', async () => {
    vi.mocked(games.getDiscordAnnouncementState).mockResolvedValue({
      discordPublishMessageId: 'msg-existing',
      discordAnnounceDescription: null,
    });
    vi.mocked(games.findByIdAdmin).mockResolvedValue(sampleGame as never);
    vi.mocked(games.delete).mockResolvedValue(sampleGame as never);

    await service.remove('game-1');

    expect(discordNotify.deleteGameAnnouncement).toHaveBeenCalledWith('msg-existing');
    expect(games.delete).toHaveBeenCalledWith('game-1');
  });

  it('still returns success if Discord publish rejects', async () => {
    const draft = { ...sampleGame, publishedAt: null };
    const published = { ...sampleGame, publishedAt: new Date() };
    vi.mocked(games.findByIdAdmin)
      .mockResolvedValueOnce(draft as never)
      .mockResolvedValueOnce(published as never);
    vi.mocked(games.update).mockResolvedValue(published as never);
    vi.spyOn(service, 'getReadiness').mockResolvedValue({
      canPublish: true,
      checks: [],
    } as never);
    vi.mocked(discordNotify.publishGameAnnouncement).mockRejectedValue(
      new Error('discord down'),
    );

    await expect(service.update('game-1', { published: true })).resolves.toMatchObject({
      slug: 'demo-game',
    });
  });
});
