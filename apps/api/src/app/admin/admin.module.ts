import { Module } from '@nestjs/common';
import { AdminDashboardController } from './dashboard/admin-dashboard.controller';

@Module({
  controllers: [AdminDashboardController],
})
export class AdminModule {}
