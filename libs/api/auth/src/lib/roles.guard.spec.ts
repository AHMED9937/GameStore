import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from './roles.decorator';

describe('RolesGuard', () => {
  const reflector = {
    getAllAndOverride: vi.fn(),
  } as unknown as Reflector;

  let guard: RolesGuard;

  beforeEach(() => {
    vi.clearAllMocks();
    guard = new RolesGuard(reflector);
  });

  function contextFor(user?: { role: 'admin' | 'user' }) {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it('allows routes without @Roles metadata', () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValue(undefined);
    expect(guard.canActivate(contextFor())).toBe(true);
  });

  it('allows admin when @Roles(admin) is required', () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValue(['admin']);
    expect(
      guard.canActivate(
        contextFor({
          role: 'admin',
        }),
      ),
    ).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, expect.any(Array));
  });

  it('rejects user role when @Roles(admin) is required', () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValue(['admin']);
    expect(() =>
      guard.canActivate(
        contextFor({
          role: 'user',
        }),
      ),
    ).toThrow(ForbiddenException);
  });
});
