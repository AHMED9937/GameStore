import { test, expect } from '@playwright/test';

const CHECKOUT_SETUP_MESSAGE = 'Stripe checkout — not implemented yet';

test.describe('checkout', () => {
  test('pay button shows setup message from API', async ({ page }) => {
    await page.route('**/api/payments/checkout', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'setup',
          integration: 'stripe',
          message: CHECKOUT_SETUP_MESSAGE,
        }),
      });
    });

    await page.goto('/checkout');
    const payButton = page.getByRole('button', { name: 'Pay with card' });
    await expect(payButton).toBeVisible();
    await payButton.click();
    await expect(page.getByText(CHECKOUT_SETUP_MESSAGE)).toBeVisible();
  });
});
