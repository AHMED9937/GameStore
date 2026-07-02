import { test, expect } from '@playwright/test';

test.describe('checkout success', () => {
  test('shows error without session_id', async ({ page }) => {
    await page.goto('/checkout/success');
    await expect(page.getByTestId('checkout-success-error')).toBeVisible();
    await expect(page.getByText('Invalid checkout session.')).toBeVisible();
  });

  test('shows demo license when session_id is present', async ({ page }) => {
    await page.goto('/checkout/success?session_id=cs_e2e_success');
    await expect(page.getByTestId('checkout-success-ready')).toBeVisible();
    await expect(page.getByTestId('checkout-license-key')).toHaveText(/GS-DEMO-/);
  });
});
