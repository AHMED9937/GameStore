import { describe, expect, it } from 'vitest';
import { resolveAccountPoolStatus } from './account-pool-status';

const now = new Date('2026-07-14T10:00:00.000Z');

describe('resolveAccountPoolStatus', () => {
  it('marks inactive accounts as not claimable', () => {
    expect(
      resolveAccountPoolStatus({
        isActive: false,
        activeUsersCount: 0,
        maxActiveUsers: 50,
        lockedUntil: null,
        now,
      }),
    ).toEqual({
      poolStatus: 'inactive',
      openSeats: 50,
      isClaimable: false,
      lockedUntil: null,
    });
  });

  it('marks locked accounts until lock expiry', () => {
    expect(
      resolveAccountPoolStatus({
        isActive: true,
        activeUsersCount: 2,
        maxActiveUsers: 50,
        lockedUntil: '2026-07-14T11:00:00.000Z',
        now,
      }),
    ).toEqual({
      poolStatus: 'locked',
      openSeats: 48,
      isClaimable: false,
      lockedUntil: '2026-07-14T11:00:00.000Z',
    });
  });

  it('marks full accounts as not claimable', () => {
    expect(
      resolveAccountPoolStatus({
        isActive: true,
        activeUsersCount: 50,
        maxActiveUsers: 50,
        lockedUntil: null,
        now,
      }),
    ).toEqual({
      poolStatus: 'full',
      openSeats: 0,
      isClaimable: false,
      lockedUntil: null,
    });
  });

  it('marks available accounts as claimable', () => {
    expect(
      resolveAccountPoolStatus({
        isActive: true,
        activeUsersCount: 10,
        maxActiveUsers: 50,
        lockedUntil: null,
        now,
      }),
    ).toEqual({
      poolStatus: 'available',
      openSeats: 40,
      isClaimable: true,
      lockedUntil: null,
    });
  });

  it('treats expired lock as available', () => {
    expect(
      resolveAccountPoolStatus({
        isActive: true,
        activeUsersCount: 1,
        maxActiveUsers: 10,
        lockedUntil: '2026-07-14T09:00:00.000Z',
        now,
      }).poolStatus,
    ).toBe('available');
  });
});
