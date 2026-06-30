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
});
