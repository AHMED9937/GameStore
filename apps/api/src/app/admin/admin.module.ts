import { Module } from '@nestjs/common';
import { AdminDashboardController } from './dashboard/admin-dashboard.controller';
import { AdminGamesController } from './games/admin-games.controller';

@Module({
  controllers: [AdminDashboardController, AdminGamesController],
})
export class AdminModule {}
