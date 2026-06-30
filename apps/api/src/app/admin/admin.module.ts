import { Module } from '@nestjs/common';
import { IgdbModule } from '@gamestore/api/igdb';
import { AdminDashboardController } from './dashboard/admin-dashboard.controller';
import { AdminGamesController } from './games/admin-games.controller';
import { AdminLicensesController } from './licenses/admin-licenses.controller';
import { AdminAccountsController } from './accounts/admin-accounts.controller';
import { AdminAuditController } from './audit/admin-audit.controller';
import { AdminIgdbController } from './igdb/admin-igdb.controller';

@Module({
  imports: [IgdbModule],
  controllers: [
    AdminDashboardController,
    AdminGamesController,
    AdminLicensesController,
    AdminAccountsController,
    AdminAuditController,
    AdminIgdbController,
  ],
})
export class AdminModule {}
