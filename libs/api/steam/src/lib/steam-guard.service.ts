import { Injectable } from '@nestjs/common';
import { SteamConfig } from './steam.config';

/** Setup shell — TODO(implement-steam): generateAuthCode(sharedSecret) via steam-totp */
@Injectable()
export class SteamGuardService {
  requestGuardCode() {
    return SteamConfig.getSetupResponse('guard-code');
  }
}
