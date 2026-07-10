import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createClerkClient, verifyToken } from '@clerk/backend';
import type { AuthUser } from './auth.types';
import { parseUserRole } from './auth.types';
import { ClerkConfig } from './clerk.config';
import { IS_PUBLIC_KEY } from './public.decorator';
import { clerkApiUserFromSdk } from './clerk-user-sync';
import { UsersRepository } from './users.repository';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly clerk = createClerkClient({
    secretKey: ClerkConfig.getSecretKey() ?? '',
  });

  constructor(
    private readonly reflector: Reflector,
    private readonly usersRepository: UsersRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: AuthUser;
    }>();

    if (isPublic) {
      await this.attachUserIfBearerPresent(request);
      return true;
    }

    const secretKey = ClerkConfig.getSecretKey();
    if (!secretKey) {
      throw new UnauthorizedException('Clerk is not configured');
    }

    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    await this.attachUserFromBearer(request, secretKey);
    return true;
  }

  /** On @Public() routes, attach the user when a valid bearer token is sent. */
  private async attachUserIfBearerPresent(request: {
    headers: { authorization?: string };
    user?: AuthUser;
  }): Promise<void> {
    const secretKey = ClerkConfig.getSecretKey();
    if (!secretKey) {
      return;
    }

    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
      return;
    }

    try {
      await this.attachUserFromBearer(request, secretKey);
    } catch {
      // Invalid token on a public route proceed without request.user
    }
  }

  private async attachUserFromBearer(
    request: {
      headers: { authorization?: string };
      user?: AuthUser;
    },
    secretKey: string,
  ): Promise<void> {
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = authorization.slice('Bearer '.length).trim();
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    let clerkId: string;
    let roleFromToken: ReturnType<typeof parseUserRole> = 'user';

    try {
      const payload = await verifyToken(token, { secretKey });
      if (!payload.sub) {
        throw new UnauthorizedException('Invalid token subject');
      }
      clerkId = payload.sub;
      roleFromToken = parseUserRole(
        (payload as { public_metadata?: unknown }).public_metadata,
      );
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    let user = await this.usersRepository.findByClerkId(clerkId);
    if (!user || (roleFromToken === 'admin' && user.role !== 'admin')) {
      const clerkUser = await this.clerk.users.getUser(clerkId);
      user = await this.usersRepository.syncFromClerkApiUser(
        clerkApiUserFromSdk(clerkUser),
      );
    }

    request.user = {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role === 'admin' ? 'admin' : 'user',
    };
  }
}
