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
        buyerCountry: null,
        source: 'admin',
        subscriptionId: null,
        validFrom: new Date('2024-01-01T00:00:00.000Z'),
        expiresAt: null,
        activatedAt: null,
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
      buyerCountry: null,
      source: 'admin',
      subscriptionId: null,
      validFrom: new Date('2024-01-01T00:00:00.000Z'),
      expiresAt: null,
      activatedAt: null,
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
    update: vi.fn().mockResolvedValue({
      id: 'license-1',
      licenseKey: 'GS-ABCD-EF12-3456',
      gameId: 'game-1',
      status: 'available',
      buyerEmail: 'updated@example.com',
      buyerCountry: 'US',
      source: 'admin',
      subscriptionId: null,
      validFrom: new Date('2024-01-01T00:00:00.000Z'),
      expiresAt: null,
      activatedAt: null,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      game: { id: 'game-1', title: 'Demo Game', slug: 'demo-game', coverImage: null },
      owner: null,
    }),
    remove: vi.fn().mockResolvedValue({ id: 'license-1', deleted: true }),
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
        source: 'admin',
        expiresAt: null,
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

  it('update delegates to licenses service and maps detail dto', async () => {
    const result = await service.update('license-1', {
      buyerEmail: 'updated@example.com',
      buyerCountry: 'US',
    });

    expect(licenses.update).toHaveBeenCalledWith('license-1', {
      buyerEmail: 'updated@example.com',
      buyerCountry: 'US',
    });
    expect(result).toMatchObject({
      id: 'license-1',
      buyerEmail: 'updated@example.com',
      buyerCountry: 'US',
      gameTitle: 'Demo Game',
      source: 'admin',
    });
  });

  it('remove delegates to licenses service', async () => {
    await expect(service.remove('license-1')).resolves.toEqual({
      id: 'license-1',
      deleted: true,
    });
    expect(licenses.remove).toHaveBeenCalledWith('license-1');
  });

  it('bulkRevoke delegates per id', async () => {
    await expect(service.bulkRevoke(['license-1', 'license-2'])).resolves.toEqual({
      succeeded: ['license-1', 'license-2'],
      failed: [],
    });
    expect(licenses.revoke).toHaveBeenCalledTimes(2);
  });

  it('bulkDelete collects failures for activated licenses', async () => {
    const { BadRequestException } = await import('@nestjs/common');
    licenses.remove
      .mockResolvedValueOnce({ id: 'license-1', deleted: true })
      .mockRejectedValueOnce(
        new BadRequestException('Cannot delete an activated license'),
      );

    const result = await service.bulkDelete(['license-1', 'license-2']);

    expect(result.succeeded).toEqual(['license-1']);
    expect(result.failed).toEqual([
      { id: 'license-2', reason: 'Cannot delete an activated license' },
    ]);
  });
});
