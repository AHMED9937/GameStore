import { test, expect } from '@playwright/test';

test.describe('admin igdb', () => {
  test('search and import flow with mocked API', async ({ page }) => {
    let importCalled = false;

    await page.route('**/api/admin/igdb/search?q=halo', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            igdbId: 77,
            title: 'Halo',
            releaseDate: '2001-11-15',
            coverUrl: null,
          },
        ]),
      });
    });

    await page.route('**/api/admin/igdb/import', async (route) => {
      importCalled = true;
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          game: {
            id: 'game-e2e-igdb',
            slug: 'halo',
            title: 'Halo',
            igdbId: 77,
            platform: 'steam',
            priceBase: '9.99',
            publishedAt: null,
          },
          updated: false,
        }),
      });
    });

    await page.goto('/admin/igdb');
    await page.getByLabel('Search IGDB').fill('halo');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.getByText('Halo')).toBeVisible();
    await page.getByRole('button', { name: 'Configure & import' }).click();
    await expect(page.getByTestId('admin-igdb-import-dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Import draft' }).click();
    await expect(page).toHaveURL(/\/admin\/games\/game-e2e-igdb\/edit/);
    expect(importCalled).toBe(true);
  });
});
