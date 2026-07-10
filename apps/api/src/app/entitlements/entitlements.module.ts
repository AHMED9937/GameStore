import { Module } from '@nestjs/common';
import { DataAccessModule } from '@gamestore/api/data-access';
import { PrismaModule } from '@gamestore/api/prisma';
import { EntitlementCleanupService } from './entitlement-cleanup.service';

@Module({
  imports: [PrismaModule, DataAccessModule],
  providers: [EntitlementCleanupService],
  exports: [EntitlementCleanupService],
})
export class EntitlementsModule {}
