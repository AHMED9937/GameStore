import { Module } from '@nestjs/common';
import { AuthModule } from '@gamestore/api/auth';
import { DataAccessModule } from '@gamestore/api/data-access';
import { PrismaModule } from '@gamestore/api/prisma';
import { IgdbModule } from '@gamestore/api/igdb';
import { SteamModule } from '@gamestore/api/steam';
import { GameAccountsService } from '../game-accounts/game-accounts.service';
import { LicensesService } from '../licenses/licenses.service';
import { AdminDashboardController } from './dashboard/admin-dashboard.controller';
import { AdminGamesController } from './games/admin-games.controller';
import { AdminGameMediaController } from './games/admin-game-media.controller';
import { AdminGameMediaService } from './games/admin-game-media.service';
import { AdminGamesService } from './games/admin-games.service';
import { AdminLicensesController } from './licenses/admin-licenses.controller';
import { AdminLicensesService } from './licenses/admin-licenses.service';
import { AdminAccountsController } from './accounts/admin-accounts.controller';
import { AdminAccountsService } from './accounts/admin-accounts.service';
import { AdminAuditController } from './audit/admin-audit.controller';
import { AdminIgdbController } from './igdb/admin-igdb.controller';
import { AdminIgdbImportService } from './igdb/admin-igdb-import.service';
import { AdminOrdersController } from './orders/admin-orders.controller';
import { AdminOrdersService } from './orders/admin-orders.service';

@Module({
  imports: [AuthModule, DataAccessModule, PrismaModule, IgdbModule, SteamModule],
  controllers: [
    AdminDashboardController,
    AdminGamesController,
    AdminGameMediaController,
    AdminLicensesController,
    AdminAccountsController,
    AdminOrdersController,
    AdminAuditController,
    AdminIgdbController,
  ],
  providers: [
    AdminGamesService,
    AdminGameMediaService,
    AdminAccountsService,
    AdminLicensesService,
    GameAccountsService,
    LicensesService,
    AdminIgdbImportService,
    AdminOrdersService,
  ],
})
export class AdminModule {}
