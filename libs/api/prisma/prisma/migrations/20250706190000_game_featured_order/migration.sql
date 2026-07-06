-- AlterTable
ALTER TABLE "games" ADD COLUMN "featuredOrder" INTEGER;

-- CreateIndex
CREATE INDEX "games_featuredOrder_idx" ON "games"("featuredOrder");
