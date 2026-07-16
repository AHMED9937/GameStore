-- CreateTable
CREATE TABLE "game_discounts" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "percentOff" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "showCountdown" BOOLEAN NOT NULL DEFAULT true,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_discounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "game_discounts_gameId_key" ON "game_discounts"("gameId");

-- CreateIndex
CREATE INDEX "game_discounts_endsAt_idx" ON "game_discounts"("endsAt");

-- AddForeignKey
ALTER TABLE "game_discounts" ADD CONSTRAINT "game_discounts_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
