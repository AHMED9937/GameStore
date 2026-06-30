import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from '@gamestore/api/auth';
import { DataAccessModule } from '@gamestore/api/data-access';
import { PrismaModule } from '@gamestore/api/prisma';
import { SteamModule } from '@gamestore/api/steam';
import { StripeModule } from '@gamestore/api/stripe';
import { AppThrottlerGuard } from '../security/app-throttler.guard';
import { RequestLoggingInterceptor } from '../security/request-logging.interceptor';
import { buildThrottlerModuleOptions } from '../security/throttle.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuditLogsController } from './audit-logs/audit-logs.controller';
import { AuditLogsService } from './audit-logs/audit-logs.service';
import { GameAccountsController } from './game-accounts/game-accounts.controller';
import { GameAccountsService } from './game-accounts/game-accounts.service';
import { GamesController } from './games/games.controller';
import { GamesService } from './games/games.service';
import { HealthController } from './health/health.controller';
import { LicensesController } from './licenses/licenses.controller';
import { LicensesService } from './licenses/licenses.service';
import { OrdersController } from './orders/orders.controller';
import { PaymentsController } from './payments/payments.controller';
import { SteamController } from './steam/steam.controller';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ThrottlerModule.forRoot(buildThrottlerModuleOptions()),
    PrismaModule,
    DataAccessModule,
    AuthModule,
    StripeModule,
    SteamModule,
    AdminModule,
  ],
  controllers: [
    AppController,
    AuditLogsController,
    GameAccountsController,
    GamesController,
    HealthController,
    LicensesController,
    OrdersController,
    PaymentsController,
    SteamController,
  ],
  providers: [
    AppService,
    AuditLogsService,
    GameAccountsService,
    GamesService,
    LicensesService,
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggingInterceptor,
    },
  ],
})
export class AppModule {}
