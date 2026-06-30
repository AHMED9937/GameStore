import { Module } from '@nestjs/common';
import { SteamAccountService } from './steam-account.service';
import { SteamGuardService } from './steam-guard.service';

@Module({
  providers: [SteamGuardService, SteamAccountService],
  exports: [SteamGuardService, SteamAccountService],
})
export class SteamModule {}
