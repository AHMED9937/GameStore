import { test, expect } from '@playwright/test';

test.describe('theme-preview', () => {
  test('loads theme preview page with heading', async ({ page }) => {
    await page.goto('/dev/theme-preview');
    await expect(page.getByRole('heading', { name: 'Theme Preview' })).toBeVisible();
    await expect(page.getByText('Amethyst')).toBeVisible();
  });

  test('exposes primary CSS variable on root', async ({ page }) => {
    await page.goto('/dev/theme-preview');
    const primary = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim(),
    );
    expect(primary).toBe('#a855f7');
  });
});
