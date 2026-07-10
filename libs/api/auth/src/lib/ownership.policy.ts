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

/**
 * Stripe checkout success page: session_id in the URL is the capability token.
 * Unauthenticated callers may poll; signed-in users must match ownerId (or admin).
 */
export function canAccessOrderBySession(
  user: AuthUser | undefined,
  ownerId: string | null | undefined,
): boolean {
  if (!ownerId) {
    return true;
  }

  if (!user) {
    return true;
  }

  return user.id === ownerId || user.role === 'admin';
}

export function assertSessionOrderAccess(
  user: AuthUser | undefined,
  ownerId: string | null | undefined,
  message = 'Sign in with the account used to purchase',
): void {
  if (!canAccessOrderBySession(user, ownerId)) {
    throw new ForbiddenException(message);
  }
}
