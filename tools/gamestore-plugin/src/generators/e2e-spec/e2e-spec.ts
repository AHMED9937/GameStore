import { formatFiles, joinPathFragments, type Tree } from '@nx/devkit';
import type { E2eSpecGeneratorSchema } from './schema';

export async function e2eSpecGenerator(tree: Tree, options: E2eSpecGeneratorSchema) {
  const app = options.app;
  const name = options.name;
  const specDir = joinPathFragments(`apps/${app}-e2e/src`);
  const specPath = joinPathFragments(specDir, `${name}.spec.ts`);

  tree.write(
    specPath,
    `import { test, expect } from '@playwright/test';

test.describe('${name}', () => {
  test('loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });
});
`,
  );

  await formatFiles(tree);
}

export default e2eSpecGenerator;
