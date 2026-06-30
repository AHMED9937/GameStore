-- AlterTable
ALTER TABLE "games" ADD COLUMN     "genres" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "igdbCoverUrl" TEXT,
ADD COLUMN     "igdbId" INTEGER,
ADD COLUMN     "igdbSyncedAt" TIMESTAMP(3),
ADD COLUMN     "releaseDate" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "games_igdbId_key" ON "games"("igdbId");
