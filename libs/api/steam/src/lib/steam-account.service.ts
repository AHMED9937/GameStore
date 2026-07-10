import { Injectable } from '@nestjs/common';
import { SteamConfig } from './steam.config';
import { SteamCryptoService } from './steam-crypto.service';

@Injectable()
export class SteamAccountService {
  constructor(private readonly crypto: SteamCryptoService) {}

  health() {
    const env = SteamConfig.getEnvStatus();
    const configured = env.encryptionKey === 'valid';

    if (!configured) {
      return {
        status: 'setup' as const,
        integration: SteamConfig.integration,
        message: 'Steam not configured',
        encryption: env.encryptionKey,
      };
    }

    return {
      status: 'ok' as const,
      integration: SteamConfig.integration,
      message: 'Steam encryption configured',
      encryption: env.encryptionKey,
      guardCooldownMinutes: env.guardCooldownMinutes,
    };
  }
}
