import { test, expect } from '@playwright/test';

const hasDatabase = Boolean(process.env.DATABASE_URL);
const hasSeedSteamSecrets = Boolean(
  process.env.SEED_STEAM_PASSWORD && process.env.SEED_STEAM_SHARED_SECRET,
);

test.describe('steam guard (mocked APIs)', () => {
  test('shows live guard code after accessing steam account', async ({ page }) => {
    await page.route('**/api/licenses/validate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          licenseKey: 'MOCK-KEY',
          status: 'available',
          game: {
            id: 'g1',
            title: 'Mock Steam Game',
            slug: 'mock-game',
            coverImage: '/og/default.png',
          },
        }),
      });
    });

    await page.route('**/api/licenses/activate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          licenseKey: 'MOCK-KEY',
          status: 'activated',
          game: {
            id: 'g1',
            title: 'Mock Steam Game',
            slug: 'mock-game',
            coverImage: '/og/default.png',
          },
          account: {
            username: 'pool-user',
            password: 'pool-pass',
          },
        }),
      });
    });

    await page.route('**/api/steam/guard-code', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'Z9X8Y',
          expiresInSeconds: 28,
          sharedSecret: 'dGVzdC1zZWNyZXQ=',
        }),
      });
    });

    await page.goto('/my-games');
    await page.getByLabel('License key').fill('MOCK-KEY');
    await page.getByRole('button', { name: 'Validate license' }).click();
    await page.getByRole('button', { name: 'Access Steam account' }).click();

    await expect(page.getByTestId('steam-account-layout')).toBeVisible();
    await expect(page.getByTestId('steam-username')).toHaveText('pool-user');
    await expect(page.getByTestId('steam-password')).toHaveText('pool-pass');
    await expect(page.getByTestId('steam-guard-code')).toHaveText('Z9X8Y');
  });
});

test.describe('activation flow (real API)', () => {
  test('validates, activates, and shows guard code for DEMO-KEY-0001', async ({
    page,
  }) => {
    test.skip(!hasDatabase, 'DATABASE_URL is not set');
    test.skip(
      !hasSeedSteamSecrets,
      'SEED_STEAM_PASSWORD and SEED_STEAM_SHARED_SECRET are required re-run seed after setting them in .env',
    );

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

    await page.getByRole('button', { name: 'Access Steam account' }).click();

    await expect(page.getByTestId('steam-account-layout')).toBeVisible();
    await expect(page.getByTestId('steam-username')).not.toHaveText('');
    await expect(page.getByTestId('steam-password')).not.toHaveText('');
    await expect(page.getByTestId('steam-guard-code')).toHaveText(/^[A-Z0-9]{5}$/);
  });
});

if (!hasDatabase) {
  // eslint-disable-next-line no-console
  console.warn('Skipping real activation web e2e: DATABASE_URL is not set');
}
