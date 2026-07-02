import type { PrismaClient } from '@prisma/client';

export function slugifyTitle(title: string): string {
  const normalized = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  return normalized || 'game';
}

export async function resolveUniqueSlug(
  prisma: Pick<PrismaClient, 'game'>,
  base: string,
  igdbId: number,
): Promise<string> {
  let slug = base;
  let attempt = 0;

  while (true) {
    const existing = await prisma.game.findUnique({ where: { slug } });
    if (!existing || existing.igdbId === igdbId) {
      return slug;
    }

    attempt += 1;
    slug = attempt > 20 ? `${base}-${igdbId}` : `${base}-${attempt}`;
  }
}
