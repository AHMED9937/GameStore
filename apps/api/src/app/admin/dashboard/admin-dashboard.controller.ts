import { Controller, Get } from '@nestjs/common';
import { Roles } from '@gamestore/api/auth';
import { AdminDashboardService } from './admin-dashboard.service';

@Roles('admin')
@Controller('admin')
export class AdminDashboardController {
  constructor(private readonly dashboard: AdminDashboardService) {}

  @Get('stats')
  getStats() {
    return this.dashboard.getStats();
  }
}
