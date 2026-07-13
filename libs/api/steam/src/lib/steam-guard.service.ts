import {
  Injectable,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import SteamTotp from 'steam-totp';
import { SteamCryptoService } from './steam-crypto.service';

const TOTP_PERIOD_SECONDS = 30;

export type SteamGuardCodeResponse = {
  code: string;
  expiresInSeconds: number;
  sharedSecret: string;
};

@Injectable()
export class SteamGuardService {
  constructor(private readonly crypto: SteamCryptoService) {}

  generateCodeFromStoredSecret(storedSecret: string): SteamGuardCodeResponse {
    if (!storedSecret?.trim()) {
      throw new UnprocessableEntityException(
        'Steam account has no shared secret. Re-save the Steam Guard secret in admin.',
      );
    }

    const sharedSecret = this.crypto.isEncrypted(storedSecret)
      ? this.crypto.decrypt(storedSecret)
      : storedSecret;

    try {
      return {
        code: SteamTotp.generateAuthCode(sharedSecret),
        expiresInSeconds: this.secondsUntilNextTotpWindow(),
        sharedSecret,
      };
    } catch (error) {
      if (
        error instanceof ServiceUnavailableException ||
        error instanceof UnprocessableEntityException
      ) {
        throw error;
      }
      throw new UnprocessableEntityException(
        'Steam Guard secret is invalid. Re-save the shared secret in admin.',
      );
    }
  }

  private secondsUntilNextTotpWindow(): number {
    const nowSeconds = SteamTotp.time();
    const elapsed = nowSeconds % TOTP_PERIOD_SECONDS;
    const remaining = TOTP_PERIOD_SECONDS - elapsed;
    return remaining > 0 ? remaining : TOTP_PERIOD_SECONDS;
  }
}
