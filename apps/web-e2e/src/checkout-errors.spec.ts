import { test, expect } from '@playwright/test';

test.describe('checkout errors', () => {
  test('shows error when game slug is not found', async ({ page }) => {
    await page.route('**/api/games/bad-slug-e2e', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 404,
          message: 'Game not found',
        }),
      });
    });

    await page.goto('/checkout?game=bad-slug-e2e');
    await expect(page.getByTestId('checkout-summary-error')).toBeVisible();
    await expect(page.getByText('This game could not be found.')).toBeVisible();
  });

  test('success page shows error for unknown session', async ({ page }) => {
    await page.goto('/checkout/success');
    await expect(page.getByTestId('checkout-success-error')).toBeVisible();
  });
});
