import { Injectable } from '@nestjs/common';
import { SteamConfig } from './steam.config';

/** Setup shell — TODO(implement-steam): decrypt GameAccount.passwordEncrypted */
@Injectable()
export class SteamAccountService {
  health() {
    return SteamConfig.getHealthResponse();
  }
}
