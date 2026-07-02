import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '@gamestore/api/prisma';
import type { AuthUser } from '@gamestore/api/auth';
import { assertOwnedResourceAccess } from '@gamestore/api/auth';
import {
  SteamConfig,
  SteamCryptoService,
  SteamGuardService,
  type SteamGuardCodeResponse,
} from '@gamestore/api/steam';

@Injectable()
export class SteamGuardAppService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: SteamCryptoService,
    private readonly steamGuard: SteamGuardService,
  ) {}

  async requestGuardCode(
    licenseKey: string | undefined,
    user: AuthUser,
  ): Promise<SteamGuardCodeResponse> {
    const key = licenseKey?.trim();
    if (!key) {
      throw new BadRequestException('licenseKey is required');
    }

    if (!this.crypto.isConfigured()) {
      throw new ServiceUnavailableException('STEAM encryption is not configured');
    }

    const license = await this.prisma.license.findUnique({
      where: { licenseKey: key },
      include: { account: true },
    });

    if (!license) {
      throw new NotFoundException('License not found');
    }
    if (license.status !== 'activated' || !license.accountId || !license.account) {
      throw new BadRequestException('License is not activated');
    }

    assertOwnedResourceAccess(
      user,
      license.ownerId,
      'You do not own this license',
    );

    const account = license.account;
    const now = new Date();
    const isSameLicenseRefresh =
      Boolean(account.lockedUntil && account.lockedUntil > now) &&
      account.guardLockedByLicenseId === license.id;

    if (account.lockedUntil && account.lockedUntil > now && !isSameLicenseRefresh) {
      const retryAfterSeconds = Math.ceil(
        (account.lockedUntil.getTime() - now.getTime()) / 1000,
      );
      throw new HttpException(
        `Steam Guard cooldown active. Try again in ${retryAfterSeconds} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const response = this.steamGuard.generateCodeFromStoredSecret(
      account.sharedSecret,
    );

    if (!isSameLicenseRefresh) {
      const cooldownMinutes = SteamConfig.readCooldownMinutes();
      const lockedUntil = new Date(now.getTime() + cooldownMinutes * 60_000);
      await this.prisma.gameAccount.update({
        where: { id: account.id },
        data: {
          lockedUntil,
          guardLockedByLicenseId: license.id,
        },
      });
    }

    return response;
  }
}
