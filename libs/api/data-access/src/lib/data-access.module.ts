import { Module } from '@nestjs/common';
import { PrismaModule } from '@gamestore/api/prisma';
import { GameAccountsRepository } from './game-accounts.repository';
import { AuditLogsRepository } from './audit-logs.repository';
import { GamesRepository } from './games.repository';
import { LicensesRepository } from './licenses.repository';
import { OrdersRepository } from './orders.repository';
import { SubscriptionPlansRepository } from './subscription-plans.repository';
import { UserSubscriptionsRepository } from './user-subscriptions.repository';
import { StoreSettingsRepository } from './store-settings.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    GamesRepository,
    LicensesRepository,
    GameAccountsRepository,
    AuditLogsRepository,
    OrdersRepository,
    SubscriptionPlansRepository,
    UserSubscriptionsRepository,
    StoreSettingsRepository,
  ],
  exports: [
    GamesRepository,
    LicensesRepository,
    GameAccountsRepository,
    AuditLogsRepository,
    OrdersRepository,
    SubscriptionPlansRepository,
    UserSubscriptionsRepository,
    StoreSettingsRepository,
  ],
})
export class DataAccessModule {}
