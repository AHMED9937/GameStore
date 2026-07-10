import { test, expect } from '@playwright/test';

test.describe('seo-setup', () => {
  test('seo preview shows resolved builder output', async ({ page }) => {
    await page.goto('/dev/seo-preview');
    await expect(page.getByRole('heading', { name: 'SEO Preview' })).toBeVisible();
    await expect(
      page.getByText('Resolved metadata from shared SEO builders.'),
    ).toBeVisible();
    await expect(page.getByText(/Home title:/)).toBeVisible();
    await expect(page.getByText(/Game title:/)).toBeVisible();
  });
});
