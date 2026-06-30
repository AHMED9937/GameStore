import { test, expect } from '@playwright/test';

const PAGES = [
  { path: '/', heading: /Next-Gen Offline Game Activations/i },
  { path: '/shop', heading: 'Game Catalog' },
  { path: '/games/test-slug', heading: 'Game not found' },
  { path: '/checkout', heading: 'Checkout' },
  { path: '/checkout/success', heading: 'Order Complete' },
  { path: '/my-games', heading: 'My Games' },
  { path: '/faq', heading: 'FAQ' },
  { path: '/contact', heading: 'Contact' },
] as const;

test.describe('pages', () => {
  for (const { path, heading } of PAGES) {
    test(`${path} renders`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    });
  }
});
