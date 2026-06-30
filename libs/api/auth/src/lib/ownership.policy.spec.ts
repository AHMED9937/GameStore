import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import type { AuthUser } from './auth.types';
import {
  assertOwnedResourceAccess,
  canAccessOwnedResource,
} from './ownership.policy';

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

const admin: AuthUser = {
  id: 'admin-1',
  clerkId: 'clerk-admin',
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'User',
  role: 'admin',
};

describe('ownership.policy', () => {
  it('allows access when ownerId is unset', () => {
    expect(canAccessOwnedResource(undefined, null)).toBe(true);
    expect(canAccessOwnedResource(userA, null)).toBe(true);
  });

  it('denies unauthenticated access to owned resources', () => {
    expect(canAccessOwnedResource(undefined, 'user-a')).toBe(false);
  });

  it('allows the owner', () => {
    expect(canAccessOwnedResource(userA, 'user-a')).toBe(true);
  });

  it('denies a different user', () => {
    expect(canAccessOwnedResource(userB, 'user-a')).toBe(false);
  });

  it('allows admin bypass', () => {
    expect(canAccessOwnedResource(admin, 'user-a')).toBe(true);
  });

  it('assertOwnedResourceAccess throws ForbiddenException', () => {
    expect(() => assertOwnedResourceAccess(userB, 'user-a')).toThrow(
      ForbiddenException,
    );
  });
});
