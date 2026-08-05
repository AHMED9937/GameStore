import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from '@gamestore/api/auth';
import { DataAccessModule } from '@gamestore/api/data-access';
import { PrismaModule } from '@gamestore/api/prisma';
import { SteamModule } from '@gamestore/api/steam';
import { PaddleModule } from '@gamestore/api/paddle';
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
import { OrdersService } from './orders/orders.service';
import { PaymentsController } from './payments/payments.controller';
import { PaymentsService } from './payments/payments.service';
import { PaymentsWebhookController } from './payments/payments-webhook.controller';
import { PaymentFulfillmentService } from './payments/payment-fulfillment.service';
import { SubscriptionFulfillmentService } from './payments/subscription-fulfillment.service';
import { SubscriptionPlansController } from './subscription-plans/subscription-plans.controller';
import { SubscriptionPlansService } from './subscription-plans/subscription-plans.service';
import { SubscriptionsController } from './subscriptions/subscriptions.controller';
import { SubscriptionsService } from './subscriptions/subscriptions.service';
import { SteamController } from './steam/steam.controller';
import { SteamGuardAppService } from './steam/steam-guard-app.service';
import { StoreSettingsController } from './store-settings/store-settings.controller';
import { StoreSettingsService } from './store-settings/store-settings.service';
import { AdminModule } from './admin/admin.module';
import { EntitlementsModule } from './entitlements/entitlements.module';

@Module({
  imports: [
    ThrottlerModule.forRoot(buildThrottlerModuleOptions()),
    PrismaModule,
    DataAccessModule,
    AuthModule,
    PaddleModule,
    SteamModule,
    AdminModule,
    EntitlementsModule,
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
    PaymentsWebhookController,
    SubscriptionPlansController,
    SubscriptionsController,
    SteamController,
    StoreSettingsController,
  ],
  providers: [
    AppService,
    AuditLogsService,
    GameAccountsService,
    GamesService,
    LicensesService,
    OrdersService,
    PaymentsService,
    PaymentFulfillmentService,
    SubscriptionFulfillmentService,
    SubscriptionPlansService,
    SubscriptionsService,
    SteamGuardAppService,
    StoreSettingsService,
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
