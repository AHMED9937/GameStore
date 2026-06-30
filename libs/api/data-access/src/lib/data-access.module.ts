import { Module } from '@nestjs/common';
import { PrismaModule } from '@gamestore/api/prisma';
import { GameAccountsRepository } from './game-accounts.repository';
import { AuditLogsRepository } from './audit-logs.repository';
import { GamesRepository } from './games.repository';
import { LicensesRepository } from './licenses.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    GamesRepository,
    LicensesRepository,
    GameAccountsRepository,
    AuditLogsRepository,
  ],
  exports: [
    GamesRepository,
    LicensesRepository,
    GameAccountsRepository,
    AuditLogsRepository,
  ],
})
export class DataAccessModule {}
