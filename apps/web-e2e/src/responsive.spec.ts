import { test, expect } from '@playwright/test';

test.describe('responsive', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('home renders at mobile width', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Next-Gen Offline Game Activations/i })).toBeVisible();
  });

  test('shop renders at mobile width', async ({ page }) => {
    await page.goto('/shop');
    await expect(page.getByRole('heading', { name: 'Game Catalog' })).toBeVisible();
  });
});
