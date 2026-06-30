import { test, expect } from '@playwright/test';

test.describe('auth routes', () => {
  test('unauthenticated /admin redirects to admin sign-in', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/sign-in/);
  });

  test('/admin/sign-in page is available', async ({ page }) => {
    const response = await page.goto('/admin/sign-in');
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { name: /admin sign in/i })).toBeVisible();
  });

  test('/admin/sign-up returns 404', async ({ page }) => {
    const response = await page.goto('/admin/sign-up');
    expect(response?.status()).toBe(404);
  });
});
