import { Module } from '@nestjs/common';
import { AdminDashboardController } from './dashboard/admin-dashboard.controller';
import { AdminGamesController } from './games/admin-games.controller';
import { AdminLicensesController } from './licenses/admin-licenses.controller';
import { AdminAccountsController } from './accounts/admin-accounts.controller';

@Module({
  controllers: [
    AdminDashboardController,
    AdminGamesController,
    AdminLicensesController,
    AdminAccountsController,
  ],
})
export class AdminModule {}
