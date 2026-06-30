import { Controller, Get } from '@nestjs/common';
import { Roles } from '@gamestore/api/auth';
import { adminSetupResponse } from '../admin-setup';

@Roles('admin')
@Controller('admin')
export class AdminDashboardController {
  @Get('stats')
  getStats() {
    return adminSetupResponse(
      'admin-dashboard',
      'Admin dashboard — not implemented yet',
    );
  }
}
