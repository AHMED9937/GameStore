import { Module } from '@nestjs/common';
import { SteamAccountService } from './steam-account.service';
import { SteamCryptoService } from './steam-crypto.service';
import { SteamGuardService } from './steam-guard.service';

@Module({
  providers: [SteamCryptoService, SteamGuardService, SteamAccountService],
  exports: [SteamCryptoService, SteamGuardService, SteamAccountService],
})
export class SteamModule {}
