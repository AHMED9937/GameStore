-- Drop display-only marketing stock columns from game discounts.
ALTER TABLE "game_discounts" DROP COLUMN IF EXISTS "stockRemaining";
ALTER TABLE "game_discounts" DROP COLUMN IF EXISTS "showStock";
