import { test, expect } from '@playwright/test';

test.describe('seo-setup', () => {
  test('seo preview shows setup message', async ({ page }) => {
    await page.goto('/dev/seo-preview');
    await expect(page.getByRole('heading', { name: 'SEO Preview' })).toBeVisible();
    await expect(
      page.getByText('SEO — setup complete. Full metadata not implemented yet.'),
    ).toBeVisible();
  });
});
