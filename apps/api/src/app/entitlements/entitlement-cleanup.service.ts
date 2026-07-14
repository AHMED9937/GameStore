import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@gamestore/api/prisma';
import {
  GameAccountsRepository,
  LicensesRepository,
  OrdersRepository,
} from '@gamestore/api/data-access';

@Injectable()
export class EntitlementCleanupService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly licenses: LicensesRepository,
    private readonly accounts: GameAccountsRepository,
    private readonly orders: OrdersRepository,
  ) {}

  async releaseLicenseFromPool(licenseId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const license = await tx.license.findUnique({
        where: { id: licenseId },
        select: { id: true, accountId: true },
      });

      if (!license?.accountId) {
        return;
      }

      const accountId = license.accountId;

      await tx.license.update({
        where: { id: licenseId },
        data: { accountId: null },
      });

      const account = await tx.gameAccount.findUnique({
        where: { id: accountId },
        select: {
          id: true,
          activeUsersCount: true,
          guardLockedByLicenseId: true,
        },
      });

      if (!account) {
        return;
      }

      await tx.gameAccount.update({
        where: { id: accountId },
        data: {
          activeUsersCount: Math.max(0, account.activeUsersCount - 1),
          ...(account.guardLockedByLicenseId === licenseId
            ? { guardLockedByLicenseId: null }
            : {}),
        },
      });
    });
  }

  async revokeLicenseWithCleanup(licenseId: string) {
    const license = await this.licenses.findByIdForCleanup(licenseId);
    if (!license) {
      throw new NotFoundException(`No license found with id "${licenseId}"`);
    }

    if (license.status === 'revoked') {
      return this.licenses.findById(licenseId);
    }

    await this.releaseLicenseFromPool(licenseId);
    return this.licenses.setRevoked(licenseId);
  }

  async revokeAllLicensesForGame(gameId: string): Promise<number> {
    const rows = await this.licenses.findByGameIdExcludingRevoked(gameId);
    let revokedCount = 0;

    for (const row of rows) {
      await this.revokeLicenseWithCleanup(row.id);
      revokedCount += 1;
    }

    return revokedCount;
  }

  /**
   * Soft-deactivates a pool account without revoking buyer licenses.
   * Callers must migrate/unassign seat-holding licenses first.
   */
  async deactivateAccountWithCleanup(accountId: string) {
    const existing = await this.accounts.findById(accountId);
    if (!existing) {
      throw new NotFoundException(`No pool account found with id "${accountId}"`);
    }

    const bound = await this.accounts.countSeatHoldingLicenses(accountId);
    if (bound > 0) {
      throw new BadRequestException(
        `Cannot deactivate: ${bound} license(s) still occupy this account. Unassign and migrate seats first.`,
      );
    }

    return this.accounts.deactivate(accountId);
  }

  async deletePendingFailedOrdersForGame(gameId: string): Promise<number> {
    const rows = await this.prisma.order.findMany({
      where: {
        gameId,
        status: { in: ['pending', 'failed'] },
      },
      select: { id: true },
    });

    for (const row of rows) {
      await this.orders.deleteById(row.id);
    }

    return rows.length;
  }

  async snapshotCompletedOrdersForGame(gameId: string): Promise<number> {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      select: { title: true, slug: true },
    });

    if (!game) {
      return 0;
    }

    const result = await this.prisma.order.updateMany({
      where: {
        gameId,
        status: 'completed',
      },
      data: {
        gameTitleSnapshot: game.title,
        gameSlugSnapshot: game.slug,
      },
    });

    return result.count;
  }

  async prepareGameForDeletion(gameId: string): Promise<{
    revokedLicenses: number;
    deletedOrders: number;
    snapshottedOrders: number;
  }> {
    const revokedLicenses = await this.revokeAllLicensesForGame(gameId);
    const deletedOrders = await this.deletePendingFailedOrdersForGame(gameId);
    const snapshottedOrders = await this.snapshotCompletedOrdersForGame(gameId);

    return { revokedLicenses, deletedOrders, snapshottedOrders };
  }
}
