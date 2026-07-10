-- AlterTable: order snapshots + nullable gameId for game deletion audit trail
ALTER TABLE "orders" ADD COLUMN "gameTitleSnapshot" TEXT;
ALTER TABLE "orders" ADD COLUMN "gameSlugSnapshot" TEXT;

ALTER TABLE "orders" DROP CONSTRAINT "orders_gameId_fkey";
ALTER TABLE "orders" ALTER COLUMN "gameId" DROP NOT NULL;
ALTER TABLE "orders" ADD CONSTRAINT "orders_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE "orders" o
SET
  "gameTitleSnapshot" = g.title,
  "gameSlugSnapshot" = g.slug
FROM "games" g
WHERE o."gameId" = g.id
  AND (o."gameTitleSnapshot" IS NULL OR o."gameSlugSnapshot" IS NULL);
