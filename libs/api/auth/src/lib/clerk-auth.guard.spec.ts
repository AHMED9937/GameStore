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

  it('syncs from Clerk when JWT metadata marks admin but Neon role is user', async () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValue(false);
    vi.mocked(verifyToken).mockResolvedValue({
      sub: 'user_admin',
      metadata: { role: 'admin' },
    } as never);
    vi.mocked(usersRepository.findByClerkId).mockResolvedValue({
      id: 'db_1',
      clerkId: 'user_admin',
      email: 'admin@example.com',
      role: 'user',
      firstName: null,
      lastName: null,
    } as never);
    vi.mocked(usersRepository.syncFromClerkApiUser).mockResolvedValue({
      id: 'db_1',
      clerkId: 'user_admin',
      email: 'admin@example.com',
      role: 'admin',
      firstName: null,
      lastName: null,
    } as never);

    const getUser = vi.fn().mockResolvedValue({
      id: 'user_admin',
      firstName: null,
      lastName: null,
      primaryEmailAddressId: 'eml_1',
      emailAddresses: [{ id: 'eml_1', emailAddress: 'admin@example.com' }],
      publicMetadata: { role: 'admin' },
    });
    const { createClerkClient } = await import('@clerk/backend');
    vi.mocked(createClerkClient).mockReturnValue({
      users: { getUser },
    } as never);
    guard = new ClerkAuthGuard(reflector, usersRepository);

    const request: {
      headers: { authorization: string };
      user?: { role: string };
    } = {
      headers: { authorization: 'Bearer good-token' },
    };

    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(usersRepository.syncFromClerkApiUser).toHaveBeenCalledOnce();
    expect(request.user?.role).toBe('admin');
  });
});
