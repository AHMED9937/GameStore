import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY, type AuthUser } from '@gamestore/api/auth';
import { resolveE2eUser } from './e2e-auth.tokens';

/**
 * Test-only ClerkAuthGuard replacement.
 * Map `Authorization: Bearer <E2E_TOKENS.*>` to users registered via `registerE2eUser`.
 */
@Injectable()
export class E2eClerkAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: AuthUser;
    }>();

    const authorization = request.headers.authorization;
    if (authorization?.startsWith('Bearer ')) {
      const token = authorization.slice('Bearer '.length).trim();
      const user = resolveE2eUser(token);
      if (user) {
        request.user = user;
      }
    }

    if (isPublic) {
      return true;
    }

    if (!request.user) {
      throw new UnauthorizedException('Missing bearer token');
    }

    return true;
  }
}
