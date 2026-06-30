import { SetMetadata } from '@nestjs/common';
import type { UserRole } from './auth.types';

export const ROLES_KEY = 'roles';

/** Require Neon `user.role` (set by ClerkAuthGuard) to match one of the listed roles. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
