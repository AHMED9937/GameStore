import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { verifyToken } from '@clerk/backend';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClerkAuthGuard } from './clerk-auth.guard';
import { IS_PUBLIC_KEY } from './public.decorator';
import type { UsersRepository } from './users.repository';

vi.mock('@clerk/backend', () => ({
  createClerkClient: vi.fn(() => ({ users: { getUser: vi.fn() } })),
  verifyToken: vi.fn(),
}));

vi.mock('./clerk.config', () => ({
  ClerkConfig: {
    getSecretKey: () => 'sk_test_guard',
  },
}));

describe('ClerkAuthGuard', () => {
  const reflector = {
    getAllAndOverride: vi.fn(),
  } as unknown as Reflector;

  const usersRepository = {
    findByClerkId: vi.fn(),
    syncFromClerkApiUser: vi.fn(),
  } as unknown as UsersRepository;

  let guard: ClerkAuthGuard;

  beforeEach(() => {
    vi.clearAllMocks();
    guard = new ClerkAuthGuard(reflector, usersRepository);
  });

  it('allows @Public() routes without Authorization header', async () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValue(true);

    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ headers: {} }),
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  });

  it('rejects protected routes without bearer token', async () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValue(false);

    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ headers: {} }),
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects protected routes when Clerk JWT verification fails', async () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValue(false);
    vi.mocked(verifyToken).mockRejectedValue(new Error('JWT expired'));

    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { authorization: 'Bearer expired-token' },
        }),
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
