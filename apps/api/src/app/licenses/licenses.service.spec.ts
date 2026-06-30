import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '@gamestore/api/auth';
import type { LicensesRepository } from '@gamestore/api/data-access';
import { LicensesService } from './licenses.service';

const userA: AuthUser = {
  id: 'user-a',
  clerkId: 'clerk-a',
  email: 'a@example.com',
  firstName: 'A',
  lastName: 'User',
  role: 'user',
};

const userB: AuthUser = {
  id: 'user-b',
  clerkId: 'clerk-b',
  email: 'b@example.com',
  firstName: 'B',
  lastName: 'User',
  role: 'user',
};

describe('LicensesService ownership', () => {
  const licenses = {
    findByKey: vi.fn(),
    findByOwnerId: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    revoke: vi.fn(),
  } as unknown as LicensesRepository;

  let service: LicensesService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new LicensesService(licenses);
  });

  it('allows validate for unassigned licenses without a user', async () => {
    vi.mocked(licenses.findByKey).mockResolvedValue({
      licenseKey: 'OPEN-KEY',
      status: 'available',
      ownerId: null,
      game: { id: 'g1', title: 'Game', slug: 'game' },
    } as never);

    await expect(service.validate('OPEN-KEY')).resolves.toEqual({
      licenseKey: 'OPEN-KEY',
      status: 'available',
      game: { id: 'g1', title: 'Game', slug: 'game' },
    });
  });

  it('rejects validate for owned licenses without auth', async () => {
    vi.mocked(licenses.findByKey).mockResolvedValue({
      licenseKey: 'OWNED-KEY',
      status: 'available',
      ownerId: 'user-a',
      game: { id: 'g1', title: 'Game', slug: 'game' },
    } as never);

    await expect(service.validate('OWNED-KEY')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('allows validate when the owner is authenticated', async () => {
    vi.mocked(licenses.findByKey).mockResolvedValue({
      licenseKey: 'OWNED-KEY',
      status: 'available',
      ownerId: 'user-a',
      game: { id: 'g1', title: 'Game', slug: 'game' },
    } as never);

    await expect(service.validate('OWNED-KEY', userA)).resolves.toEqual({
      licenseKey: 'OWNED-KEY',
      status: 'available',
      game: { id: 'g1', title: 'Game', slug: 'game' },
    });
  });

  it('rejects validate when a different user is authenticated', async () => {
    vi.mocked(licenses.findByKey).mockResolvedValue({
      licenseKey: 'OWNED-KEY',
      status: 'available',
      ownerId: 'user-a',
      game: { id: 'g1', title: 'Game', slug: 'game' },
    } as never);

    await expect(service.validate('OWNED-KEY', userB)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('findMine returns licenses for the current user', async () => {
    const rows = [
      {
        id: 'lic-1',
        licenseKey: 'KEY-1',
        status: 'available',
        game: { id: 'g1', title: 'Game', slug: 'game' },
      },
    ];
    vi.mocked(licenses.findByOwnerId).mockResolvedValue(rows as never);

    await expect(service.findMine(userA)).resolves.toEqual(rows);
    expect(licenses.findByOwnerId).toHaveBeenCalledWith('user-a');
  });
});
