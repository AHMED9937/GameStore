-- Preferred next Steam pool account for buyer seat reservation.
ALTER TABLE "games" ADD COLUMN "nextAccountId" TEXT;

CREATE INDEX "games_nextAccountId_idx" ON "games"("nextAccountId");

ALTER TABLE "games" ADD CONSTRAINT "games_nextAccountId_fkey" FOREIGN KEY ("nextAccountId") REFERENCES "game_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
