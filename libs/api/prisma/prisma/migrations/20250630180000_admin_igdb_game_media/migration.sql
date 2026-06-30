-- CreateTable
CREATE TABLE "game_media" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "igdbId" INTEGER,
    "title" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "game_media_gameId_type_sortOrder_idx" ON "game_media"("gameId", "type", "sortOrder");

-- AddForeignKey
ALTER TABLE "game_media" ADD CONSTRAINT "game_media_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
