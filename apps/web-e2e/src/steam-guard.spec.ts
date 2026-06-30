import { test, expect } from '@playwright/test';

const STEAM_GUARD_SETUP_MESSAGE = 'Steam Guard — not implemented yet';

test.describe('steam guard', () => {
  test('guard button shows setup message from API', async ({ page }) => {
    await page.route('**/api/steam/guard-code', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'setup',
          integration: 'steam',
          message: STEAM_GUARD_SETUP_MESSAGE,
        }),
      });
    });

    await page.goto('/my-games');
    const guardButton = page.getByRole('button', {
      name: 'Request Steam Guard code',
    });
    await expect(guardButton).toBeVisible();
    await guardButton.click();
    await expect(page.getByText(STEAM_GUARD_SETUP_MESSAGE)).toBeVisible();
  });
});
