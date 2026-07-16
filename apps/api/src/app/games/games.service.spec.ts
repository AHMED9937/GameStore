import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type {
  GameAccountsRepository,
  GamesRepository,
  StoreSettingsRepository,
} from '@gamestore/api/data-access';
import { GamesService } from './games.service';
import {
  STORE_DEFAULT_ACTIVATION_MEDIA_ID,
  STORE_DEFAULT_ACTIVATION_TITLE,
} from './activation-video.constants';

const baseGame = {
  id: 'game-1',
  slug: 'demo-game',
  title: 'Demo Game',
  description: 'Description',
  platform: 'steam',
  priceBase: { toString: () => '9.99' },
  coverImage: '/cover.png',
  coverCardImage: null,
  genres: ['Action'],
  releaseDate: new Date('2026-01-01'),
  requirementsMin: null,
  requirementsRecommended: null,
  soldOut: false,
  metaTitle: 'Custom Meta Title',
  metaDescription: 'Custom meta description.',
  ogImage: 'https://cdn.example.com/og.jpg',
  media: [] as Array<{
    id: string;
    type: string;
    url: string;
    title: string | null;
    sortOrder: number;
  }>,
};

describe('GamesService findBySlug activation fallback', () => {
  const games = {
    findBySlug: vi.fn(),
  } as unknown as GamesRepository;

  const gameAccounts = {
    getActivePoolFlagsByGameIds: vi.fn().mockResolvedValue(new Map()),
  } satisfies Pick<GameAccountsRepository, 'getActivePoolFlagsByGameIds'>;

  const storeSettings = {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  } satisfies Pick<StoreSettingsRepository, 'get' | 'set' | 'delete'>;

  const service = new GamesService(
    games,
    gameAccounts as unknown as GameAccountsRepository,
    storeSettings as unknown as StoreSettingsRepository,
  );

  it('returns game without activation when no per-game media and no default', async () => {
    vi.mocked(games.findBySlug).mockResolvedValue(baseGame as never);
    vi.mocked(storeSettings.get).mockResolvedValue(null);

    const result = await service.findBySlug('demo-game');

    expect(result.media).toEqual([]);
  });

  it('injects store default activation media when game has none', async () => {
    vi.mocked(games.findBySlug).mockResolvedValue(baseGame as never);
    vi.mocked(storeSettings.get).mockResolvedValue(
      'https://www.youtube.com/embed/default123',
    );

    const result = await service.findBySlug('demo-game');

    expect(result.media).toEqual([
      {
        id: STORE_DEFAULT_ACTIVATION_MEDIA_ID,
        type: 'activation',
        url: 'https://www.youtube.com/embed/default123',
        title: STORE_DEFAULT_ACTIVATION_TITLE,
        sortOrder: 0,
      },
    ]);
  });

  it('keeps per-game activation media when present', async () => {
    vi.mocked(games.findBySlug).mockResolvedValue({
      ...baseGame,
      media: [
        {
          id: 'media-1',
          type: 'activation',
          url: 'https://www.youtube.com/embed/custom',
          title: 'Custom guide',
          sortOrder: 0,
        },
      ],
    } as never);
    vi.mocked(storeSettings.get).mockResolvedValue(
      'https://www.youtube.com/embed/default123',
    );

    const result = await service.findBySlug('demo-game');

    expect(result.media).toEqual([
      {
        id: 'media-1',
        type: 'activation',
        url: 'https://www.youtube.com/embed/custom',
        title: 'Custom guide',
        sortOrder: 0,
      },
    ]);
  });

  it('findBySlug includes seo fields', async () => {
    vi.mocked(games.findBySlug).mockResolvedValue(baseGame as never);
    vi.mocked(storeSettings.get).mockResolvedValue(null);

    const result = await service.findBySlug('demo-game');

    expect(result.metaTitle).toBe('Custom Meta Title');
    expect(result.metaDescription).toBe('Custom meta description.');
    expect(result.ogImage).toBe('https://cdn.example.com/og.jpg');
  });

  it('throws when slug is missing', async () => {
    vi.mocked(games.findBySlug).mockResolvedValue(null);

    await expect(service.findBySlug('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('GamesService soldOut', () => {
  const games = {
    findPublished: vi.fn(),
    findFeaturedPublished: vi.fn(),
    findBySlug: vi.fn(),
  } as unknown as GamesRepository;

  const gameAccounts = {
    getActivePoolFlagsByGameIds: vi.fn(),
  } as unknown as GameAccountsRepository;

  const storeSettings = {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn(),
    delete: vi.fn(),
  } as unknown as StoreSettingsRepository;

  const service = new GamesService(games, gameAccounts, storeSettings);

  it('findAll returns effective soldOut from manual flag and pool', async () => {
    vi.mocked(games.findPublished).mockResolvedValue([
      { ...baseGame, id: 'g1', soldOut: true },
      { ...baseGame, id: 'g2', soldOut: false },
    ] as never);
    vi.mocked(gameAccounts.getActivePoolFlagsByGameIds).mockResolvedValue(
      new Map([
        ['g1', true],
        ['g2', false],
      ]),
    );

    const result = await service.findAll();

    expect(result).toEqual([
      expect.objectContaining({ id: 'g1', soldOut: true }),
      expect.objectContaining({ id: 'g2', soldOut: true }),
    ]);
  });

  it('findBySlug includes effective soldOut', async () => {
    vi.mocked(games.findBySlug).mockResolvedValue({
      ...baseGame,
      soldOut: false,
    } as never);
    vi.mocked(gameAccounts.getActivePoolFlagsByGameIds).mockResolvedValue(
      new Map([['game-1', true]]),
    );

    const result = await service.findBySlug('demo-game');

    expect(result.soldOut).toBe(false);
  });

  it('includes active public discount on catalog and detail', async () => {
    const discount = {
      percentOff: 20,
      startsAt: new Date('2026-01-01'),
      endsAt: new Date('2099-01-01'),
      showCountdown: true,
      enabled: true,
    };
    vi.mocked(games.findPublished).mockResolvedValue([
      { ...baseGame, discount },
    ] as never);
    vi.mocked(gameAccounts.getActivePoolFlagsByGameIds).mockResolvedValue(
      new Map([['game-1', true]]),
    );

    const catalog = await service.findAll();
    expect(catalog[0].discount).toEqual({
      percentOff: 20,
      priceSale: '7.99',
      endsAt: discount.endsAt.toISOString(),
      showCountdown: true,
    });

    vi.mocked(games.findBySlug).mockResolvedValue({
      ...baseGame,
      discount,
    } as never);

    const detail = await service.findBySlug('demo-game');
    expect(detail.discount?.priceSale).toBe('7.99');
  });
});
