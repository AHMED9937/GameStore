import {
  formatFiles,
  generateFiles,
  readProjectConfiguration,
  type Tree,
} from '@nx/devkit';
import { applicationGenerator as nextApplicationGenerator } from '@nx/next';
import { applicationGenerator as nestApplicationGenerator } from '@nx/nest';
import { configurationGenerator as playwrightConfigurationGenerator } from '@nx/playwright';
import { libraryGenerator as jsLibraryGenerator } from '@nx/js';
import * as path from 'path';
import type { InitWorkspaceGeneratorSchema } from './schema';

export async function initWorkspaceGenerator(
  tree: Tree,
  _options: InitWorkspaceGeneratorSchema,
) {
  if (!tree.exists('.env.example')) {
    generateFiles(tree, path.join(__dirname, 'files'), '.', {});
  }

  const tasks: Array<() => void> = [];

  if (!tree.exists('apps/web/project.json')) {
    tasks.push(
      await nextApplicationGenerator(tree, {
        directory: 'apps/web',
        name: 'web',
        style: 'css',
        linter: 'eslint',
        unitTestRunner: 'none',
        e2eTestRunner: 'none',
        skipFormat: true,
      }),
    );
  }

  if (!tree.exists('apps/api/project.json')) {
    tasks.push(
      await nestApplicationGenerator(tree, {
        directory: 'apps/api',
        name: 'api',
        linter: 'eslint',
        unitTestRunner: 'none',
        e2eTestRunner: 'none',
        skipFormat: true,
      }),
    );
  }

  if (!tree.exists('apps/web-e2e/project.json')) {
    try {
      readProjectConfiguration(tree, 'web');
      tasks.push(
        await playwrightConfigurationGenerator(tree, {
          project: 'web',
          directory: '../web-e2e',
          skipFormat: true,
        }),
      );
    } catch {
      // web project not registered yet
    }
  }

  if (!tree.exists('libs/testing/test-utils/project.json')) {
    tasks.push(
      await jsLibraryGenerator(tree, {
        name: 'test-utils',
        directory: 'libs/testing/test-utils',
        importPath: '@gamestore/testing/test-utils',
        tags: 'scope:shared,type:util',
        linter: 'eslint',
        unitTestRunner: 'none',
        skipFormat: true,
      }),
    );
  }

  if (!tree.exists('README.md')) {
    tree.write(
      'README.md',
      `# GameStore

Nx monorepo for the GameStore platform.

## Scaffold commands

\`\`\`bash
pnpm nx g @gamestore/workspace:init-workspace
pnpm nx g @gamestore/workspace:theme-lib
pnpm nx g @gamestore/workspace:web-feature --name=catalog --route=/shop
pnpm nx g @gamestore/workspace:api-resource --resource=games
\`\`\`
`,
    );
  }

  await formatFiles(tree);

  return () => {
    for (const task of tasks) {
      task();
    }
  };
}

export default initWorkspaceGenerator;
