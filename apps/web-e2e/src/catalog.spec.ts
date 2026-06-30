import { test, expect } from '@playwright/test';

const hasDatabase = Boolean(process.env.DATABASE_URL);

test.describe('catalog', () => {
  test('shop shows seeded game titles when API and DB are available', async ({
    page,
  }) => {
    test.skip(!hasDatabase, 'DATABASE_URL is not set');

    await page.goto('/shop');
    await expect(
      page.getByRole('heading', { name: 'Game Catalog' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Stellar Odyssey' }),
    ).toBeVisible();
  });
});

if (!hasDatabase) {
  // eslint-disable-next-line no-console
  console.warn('Skipping catalog DB e2e tests: DATABASE_URL is not set');
}
