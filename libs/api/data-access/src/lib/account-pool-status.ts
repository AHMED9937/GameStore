/** Runtime pool status for admin Steam accounts (seats include reserved + activated). */

export type AccountPoolStatus =
  | 'inactive'
  | 'locked'
  | 'full'
  | 'available';

export type AccountPoolStatusInput = {
  isActive: boolean;
  activeUsersCount: number;
  maxActiveUsers: number;
  lockedUntil: Date | string | null;
  now?: Date;
};

export type AccountPoolStatusView = {
  poolStatus: AccountPoolStatus;
  openSeats: number;
  isClaimable: boolean;
  lockedUntil: string | null;
};

export function resolveAccountPoolStatus(
  account: AccountPoolStatusInput,
): AccountPoolStatusView {
  const now = account.now ?? new Date();
  const max = Math.max(1, account.maxActiveUsers);
  const occupied = Math.max(0, account.activeUsersCount);
  const openSeats = Math.max(0, max - occupied);

  const lockedUntilDate = toDateOrNull(account.lockedUntil);
  const lockedUntil =
    lockedUntilDate && lockedUntilDate.getTime() > now.getTime()
      ? lockedUntilDate.toISOString()
      : null;

  if (!account.isActive) {
    return {
      poolStatus: 'inactive',
      openSeats,
      isClaimable: false,
      lockedUntil,
    };
  }

  if (lockedUntil) {
    return {
      poolStatus: 'locked',
      openSeats,
      isClaimable: false,
      lockedUntil,
    };
  }

  if (openSeats <= 0) {
    return {
      poolStatus: 'full',
      openSeats: 0,
      isClaimable: false,
      lockedUntil: null,
    };
  }

  return {
    poolStatus: 'available',
    openSeats,
    isClaimable: true,
    lockedUntil: null,
  };
}

function toDateOrNull(value: Date | string | null): Date | null {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
