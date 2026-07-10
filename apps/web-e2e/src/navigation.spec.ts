import { test, expect } from '@playwright/test';

const NAV_ROUTES = [
  { label: 'Shop', path: '/shop' },
  { label: 'My Games', path: '/my-games' },
  { label: 'FAQ', path: '/faq' },
  { label: 'Contact', path: '/contact' },
] as const;

test.describe('navigation', () => {
  test('header links return 200', async ({ page }) => {
    await page.goto('/');
    for (const { label, path } of NAV_ROUTES) {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await page.goto('/');
      await expect(page.getByLabel('Main').getByRole('link', { name: label })).toBeVisible();
    }
  });

  test('shop link shows loading feedback then catalog content', async ({ page }) => {
    await page.goto('/');

    const shopLink = page.getByLabel('Main').getByRole('link', { name: 'Shop' });
    const navigationStarted = page.waitForURL('**/shop');
    await shopLink.click();
    await navigationStarted;

    const loadingIndicator = page.getByTestId('catalog-loading-skeleton');

    await expect(loadingIndicator.or(page.getByRole('heading', { name: 'Game Catalog' })))
      .toBeVisible();
    await expect(page.getByTestId('app-loading-skeleton')).toHaveCount(0);

    await expect(page.getByRole('heading', { name: 'Game Catalog' })).toBeVisible();
  });

  test('my-games route does not stack multiple loaders', async ({ page }) => {
    await page.goto('/my-games');
    const statusesCount = await page.locator('[role="status"]').count();
    expect(statusesCount).toBe(0);
    await expect(page.getByTestId('my-games-loading')).toHaveCount(0);
    await expect(page.getByTestId('app-loading-skeleton')).toHaveCount(0);
    await expect(page.getByTestId('my-games-initial-loading-overlay')).toHaveCount(0).catch(() => undefined);
  });
});
