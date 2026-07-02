-- AlterTable: game_accounts
ALTER TABLE "game_accounts" ADD COLUMN "maxActiveUsers" INTEGER NOT NULL DEFAULT 50;

-- AlterTable: licenses
ALTER TABLE "licenses" ADD COLUMN "subscriptionId" TEXT;
ALTER TABLE "licenses" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'admin';
ALTER TABLE "licenses" ADD COLUMN "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "licenses" ADD COLUMN "expiresAt" TIMESTAMP(3);

-- AlterTable: orders
ALTER TABLE "orders" ADD COLUMN "orderType" TEXT NOT NULL DEFAULT 'one_time';

-- Backfill license source from orders
UPDATE "licenses" AS l
SET "source" = 'purchase'
FROM "orders" AS o
WHERE o."licenseId" = l."id";

-- CreateTable: subscription_plans
CREATE TABLE "subscription_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "stripePriceId" TEXT NOT NULL,
    "interval" TEXT NOT NULL,
    "intervalCount" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable: subscription_plan_games
CREATE TABLE "subscription_plan_games" (
    "planId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,

    CONSTRAINT "subscription_plan_games_pkey" PRIMARY KEY ("planId","gameId")
);

-- CreateTable: user_subscriptions
CREATE TABLE "user_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "status" TEXT NOT NULL,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_slug_key" ON "subscription_plans"("slug");
CREATE UNIQUE INDEX "subscription_plans_stripePriceId_key" ON "subscription_plans"("stripePriceId");
CREATE UNIQUE INDEX "user_subscriptions_stripeSubscriptionId_key" ON "user_subscriptions"("stripeSubscriptionId");
CREATE INDEX "user_subscriptions_userId_status_idx" ON "user_subscriptions"("userId", "status");
CREATE INDEX "licenses_subscriptionId_idx" ON "licenses"("subscriptionId");
CREATE INDEX "licenses_expiresAt_idx" ON "licenses"("expiresAt");
CREATE INDEX "licenses_source_status_idx" ON "licenses"("source", "status");
CREATE UNIQUE INDEX "licenses_subscriptionId_gameId_ownerId_key" ON "licenses"("subscriptionId", "gameId", "ownerId");

-- AddForeignKey
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "user_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "subscription_plan_games" ADD CONSTRAINT "subscription_plan_games_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "subscription_plan_games" ADD CONSTRAINT "subscription_plan_games_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
