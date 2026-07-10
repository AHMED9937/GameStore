-- Drop FK and make gameId optional so pool accounts can live in inventory before assignment.
ALTER TABLE "game_accounts" DROP CONSTRAINT "game_accounts_gameId_fkey";

ALTER TABLE "game_accounts" ALTER COLUMN "gameId" DROP NOT NULL;

ALTER TABLE "game_accounts" ADD CONSTRAINT "game_accounts_gameId_fkey"
  FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE SET NULL ON UPDATE CASCADE;
