import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { AdminLicensesService } from './admin-licenses.service';
import type { LicensesService } from '../../licenses/licenses.service';
import type { GamesRepository } from '@gamestore/api/data-access';

describe('AdminLicensesService', () => {
  const licenses = {
    findAll: vi.fn().mockResolvedValue([
      {
        id: 'license-1',
        licenseKey: 'GS-ABCD-EF12-3456',
        gameId: 'game-1',
        status: 'available',
        buyerEmail: 'buyer@example.com',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        game: { id: 'game-1', title: 'Demo Game', slug: 'demo-game', coverImage: null },
        owner: null,
      },
    ]),
    findOne: vi.fn().mockResolvedValue({
      id: 'license-1',
      licenseKey: 'GS-ABCD-EF12-3456',
      gameId: 'game-1',
      status: 'available',
      buyerEmail: 'buyer@example.com',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      game: { id: 'game-1', title: 'Demo Game', slug: 'demo-game', coverImage: null },
      owner: null,
    }),
    create: vi.fn().mockResolvedValue({
      id: 'license-2',
      licenseKey: 'GS-1111-2222-3333',
      gameId: 'game-1',
      status: 'available',
      buyerEmail: null,
    }),
    revoke: vi.fn().mockResolvedValue({ id: 'license-1', status: 'revoked' }),
  } satisfies LicensesService;

  const games = {
    findById: vi.fn().mockResolvedValue({ id: 'game-1', title: 'Demo Game' }),
  } satisfies Pick<GamesRepository, 'findById'>;

  const service = new AdminLicensesService(
    licenses as unknown as LicensesService,
    games as unknown as GamesRepository,
  );

  it('findAll masks license keys', async () => {
    await expect(service.findAll()).resolves.toEqual([
      {
        id: 'license-1',
        licenseKeyMasked: 'GS-****-3456',
        gameTitle: 'Demo Game',
        ownerEmail: 'buyer@example.com',
        status: 'available',
      },
    ]);
  });

  it('generateKey creates a license for an existing game', async () => {
    const result = await service.generateKey({ gameId: 'game-1' });
    expect(result.gameId).toBe('game-1');
    expect(result.status).toBe('available');
    expect(licenses.create).toHaveBeenCalled();
  });

  it('generateKey rejects unknown games', async () => {
    games.findById.mockResolvedValueOnce(null);
    await expect(service.generateKey({ gameId: 'missing' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
