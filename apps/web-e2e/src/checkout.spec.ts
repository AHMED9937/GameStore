import { test, expect } from '@playwright/test';

const mockGame = {
  id: 'game-1',
  slug: 'demo-game-1',
  title: 'Stellar Odyssey',
  description: 'A space adventure',
  platform: 'steam',
  priceBase: '19.99',
  coverImage: null,
  genres: ['Adventure'],
  releaseDate: '2025-01-01',
  requirementsMin: null,
  requirementsRecommended: null,
  media: [],
};

test.describe('checkout', () => {
  test('shows idle state without game query', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page.getByTestId('checkout-summary-idle')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Browse games' })).toBeVisible();
  });

  test('loads game summary and starts stripe checkout', async ({ page }) => {
    await page.route('**/api/games/demo-game-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockGame),
      });
    });

    await page.route('**/api/payments/checkout', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 300));

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessionId: 'cs_test_playwright',
          url: 'https://checkout.stripe.com/pay/cs_test_playwright',
        }),
      });
    });

    await page.goto('/checkout?game=demo-game-1');
    await expect(page.getByTestId('checkout-summary-ready')).toBeVisible();
    await expect(page.getByText('Stellar Odyssey')).toBeVisible();

    const redirect = page.waitForURL('https://checkout.stripe.com/pay/cs_test_playwright');
    await page.getByTestId('checkout-pay-button').click();
    await expect(page.getByTestId('checkout-pay-loading')).toBeVisible();
    await redirect;
  });

  test('shows cancel banner when cancelled query is set', async ({ page }) => {
    await page.route('**/api/games/demo-game-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockGame),
      });
    });

    await page.goto('/checkout?game=demo-game-1&cancelled=1');
    await expect(page.getByTestId('checkout-cancelled-banner')).toBeVisible();
  });
});
