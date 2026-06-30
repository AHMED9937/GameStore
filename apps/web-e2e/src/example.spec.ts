import { test, expect } from '@playwright/test';

test('home page has hero heading', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /Next-Gen Offline Game Activations/i }),
  ).toBeVisible();
});
