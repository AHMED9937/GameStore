import { test, expect } from '@playwright/test';

test.describe('checkout success', () => {
  test('shows error without session_id', async ({ page }) => {
    await page.goto('/checkout/success');
    await expect(page.getByTestId('checkout-success-error')).toBeVisible();
    await expect(page.getByText('Invalid checkout session.')).toBeVisible();
  });

  test('shows license when session lookup completes', async ({ page }) => {
    await page.route('**/api/orders/by-session/cs_e2e_success', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'completed',
          order: {
            id: 'order-e2e',
            amount: '9.99',
            currency: 'usd',
            buyerEmail: null,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
          license: {
            licenseKey: 'GS-E2E-KEY',
            status: 'available',
            game: { id: 'game-1', title: 'E2E Game', slug: 'e2e-game' },
          },
        }),
      });
    });

    await page.goto('/checkout/success?session_id=cs_e2e_success');
    await expect(page.getByTestId('checkout-success-ready')).toBeVisible();
    await expect(page.getByTestId('checkout-license-key')).toHaveText('GS-E2E-KEY');
  });

  test('polls pending then shows license', async ({ page }) => {
    let requestCount = 0;

    await page.route('**/api/orders/by-session/cs_e2e_pending', async (route) => {
      requestCount += 1;
      if (requestCount === 1) {
        await route.fulfill({
          status: 202,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'pending',
            message: 'Payment received issuing your license…',
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'completed',
          order: {
            id: 'order-e2e-pending',
            amount: '9.99',
            currency: 'usd',
            buyerEmail: null,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
          license: {
            licenseKey: 'GS-E2E-POLL',
            status: 'available',
            game: { id: 'game-1', title: 'E2E Game', slug: 'e2e-game' },
          },
        }),
      });
    });

    await page.goto('/checkout/success?session_id=cs_e2e_pending');
    await expect(page.getByTestId('checkout-success-pending')).toBeVisible();
    await expect(page.getByTestId('checkout-success-ready')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByTestId('checkout-license-key')).toHaveText('GS-E2E-POLL');
    expect(requestCount).toBeGreaterThanOrEqual(2);
  });
});
