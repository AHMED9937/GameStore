import { Injectable } from '@nestjs/common';
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
    const sharedSecret = this.crypto.isEncrypted(storedSecret)
      ? this.crypto.decrypt(storedSecret)
      : storedSecret;

    return {
      code: SteamTotp.generateAuthCode(sharedSecret),
      expiresInSeconds: this.secondsUntilNextTotpWindow(),
      sharedSecret,
    };
  }

  private secondsUntilNextTotpWindow(): number {
    const nowSeconds = SteamTotp.time();
    const elapsed = nowSeconds % TOTP_PERIOD_SECONDS;
    const remaining = TOTP_PERIOD_SECONDS - elapsed;
    return remaining > 0 ? remaining : TOTP_PERIOD_SECONDS;
  }
}
