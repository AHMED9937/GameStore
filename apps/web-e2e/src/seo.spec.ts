import { test, expect } from '@playwright/test';

const hasDatabase = Boolean(process.env.DATABASE_URL);

test.describe('seo', () => {
  test('home and shop have different titles', async ({ page }) => {
    await page.goto('/');
    const homeTitle = await page.title();

    await page.goto('/shop');
    const shopTitle = await page.title();

    expect(homeTitle).not.toBe(shopTitle);
    expect(homeTitle.length).toBeGreaterThan(0);
    expect(shopTitle.length).toBeGreaterThan(0);
  });

  test('published game page has unique metadata', async ({ page }) => {
    test.skip(!hasDatabase, 'DATABASE_URL is not set');

    await page.goto('/games/demo-game-1');

    if (page.url().includes('demo-game-1')) {
      const title = await page.title();
      expect(title.toLowerCase()).toContain('stellar odyssey');

      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        /\/games\/demo-game-1$/,
      );
      await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
      await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
    }
  });

  test('checkout is noindex', async ({ page }) => {
    await page.goto('/checkout');

    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      /noindex/i,
    );
  });

  test('sitemap lists shop and published games when database is available', async ({
    request,
  }) => {
    test.skip(!hasDatabase, 'DATABASE_URL is not set');

    const response = await request.get('/sitemap.xml');
    expect(response.ok()).toBeTruthy();

    const body = await response.text();
    expect(body).toContain('/shop');
    expect(body).toContain('/games/demo-game-1');
  });

  test('robots disallows admin routes', async ({ request }) => {
    const response = await request.get('/robots.txt');
    expect(response.ok()).toBeTruthy();

    const body = await response.text();
    expect(body).toContain('Disallow: /admin');
  });
});
