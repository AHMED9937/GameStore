import { test, expect } from '@playwright/test';

const PROTECTED_ADMIN_ROUTES = [
  '/admin',
  '/admin/games',
  '/admin/games/new',
  '/admin/licenses',
  '/admin/licenses/new',
  '/admin/accounts',
  '/admin/accounts/new',
  '/admin/orders',
  '/admin/audit',
  '/admin/igdb',
] as const;

test.describe('admin scaffold', () => {
  test('admin sign-in page is available', async ({ page }) => {
    const response = await page.goto('/admin/sign-in');
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { name: /admin sign in/i })).toBeVisible();
  });

  for (const route of PROTECTED_ADMIN_ROUTES) {
    test(`unauthenticated ${route} redirects to admin sign-in`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/admin\/sign-in/);
      const url = new URL(page.url());
      expect(url.searchParams.get('redirect_url')).toBe(route);
    });
  }
});
