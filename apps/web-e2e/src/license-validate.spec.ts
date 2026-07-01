import { test, expect } from '@playwright/test';

const hasDatabase = Boolean(process.env.DATABASE_URL);

test.describe('license validate', () => {
  test('validates DEMO-KEY-0001 and shows game picker', async ({ page }) => {
    test.skip(!hasDatabase, 'DATABASE_URL is not set');

    await page.goto('/my-games');
    await page.getByLabel('License key').fill('DEMO-KEY-0001');
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes('/api/licenses/validate') &&
          response.status() === 200,
      ),
      page.getByRole('button', { name: 'Validate license' }).click(),
    ]);
    await expect(page.getByTestId('license-game-picker')).toBeVisible();
    await expect(page.getByText('Stellar Odyssey')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Access Steam account' }),
    ).toBeVisible();
  });

  test('shows error for invalid license key', async ({ page }) => {
    test.skip(!hasDatabase, 'DATABASE_URL is not set');

    await page.goto('/my-games');
    await page.getByLabel('License key').fill('INVALID-KEY-E2E');
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes('/api/licenses/validate') &&
          response.status() === 404,
      ),
      page.getByRole('button', { name: 'Validate license' }).click(),
    ]);
    await expect(page.getByText('License not found')).toBeVisible();
  });
});

if (!hasDatabase) {
  // eslint-disable-next-line no-console
  console.warn(
    'Skipping license validate DB e2e tests: DATABASE_URL is not set',
  );
}
