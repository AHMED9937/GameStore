import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { PrismaModule } from '@gamestore/api/prisma';
import { AuditLogService } from './audit-log.service';
import { ClerkAuthGuard } from './clerk-auth.guard';
import { ClerkWebhookController } from './clerk-webhook.controller';
import { RolesGuard } from './roles.guard';
import { SecurityAuditExceptionFilter } from './security-audit.exception-filter';
import { UsersRepository } from './users.repository';
import { UsersSyncController } from './users-sync.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ClerkWebhookController, UsersSyncController],
  providers: [
    UsersRepository,
    AuditLogService,
    ClerkAuthGuard,
    RolesGuard,
    SecurityAuditExceptionFilter,
    {
      provide: APP_GUARD,
      useExisting: ClerkAuthGuard,
    },
    {
      provide: APP_GUARD,
      useExisting: RolesGuard,
    },
    {
      provide: APP_FILTER,
      useClass: SecurityAuditExceptionFilter,
    },
  ],
  exports: [
    UsersRepository,
    AuditLogService,
    ClerkAuthGuard,
    RolesGuard,
    SecurityAuditExceptionFilter,
  ],
})
export class AuthModule {}
