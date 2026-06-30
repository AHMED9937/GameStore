import { ForbiddenException } from '@nestjs/common';
import type { AuthUser } from './auth.types';

/** Unassigned resources (no ownerId) remain accessible until purchase assigns an owner. */
export function canAccessOwnedResource(
  user: AuthUser | undefined,
  ownerId: string | null | undefined,
): boolean {
  if (!ownerId) {
    return true;
  }

  if (!user) {
    return false;
  }

  return user.id === ownerId || user.role === 'admin';
}

export function assertOwnedResourceAccess(
  user: AuthUser | undefined,
  ownerId: string | null | undefined,
  message = 'You do not have access to this resource',
): void {
  if (!canAccessOwnedResource(user, ownerId)) {
    throw new ForbiddenException(message);
  }
}
