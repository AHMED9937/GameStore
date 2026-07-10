import { test, expect } from '@playwright/test';

test.describe('global loading', () => {
  test('navigation loading indicators do not stack', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Main').getByRole('link', { name: 'Shop' }).click();
    await expect(
      page
        .getByTestId('catalog-loading-skeleton')
        .or(page.getByRole('heading', { name: 'Game Catalog' })),
    ).toBeVisible();
    await expect(page.getByTestId('app-loading-skeleton')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Game Catalog' })).toBeVisible();
  });

  test('admin routes avoid stacked route and global loaders', async ({ page }) => {
    await page.goto('/admin/igdb');
    await expect(page.getByTestId('app-loading-skeleton')).toHaveCount(0);
    await expect(page.getByTestId('admin-loading')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'IGDB import' })).toBeVisible();
  });
});
