import {
  formatFiles,
  generateFiles,
  joinPathFragments,
  type Tree,
} from '@nx/devkit';
import { libraryGenerator as jsLibraryGenerator } from '@nx/js';
import * as path from 'path';
import { apiImportPath, toNames } from '../../utils/names';
import { apiLibRoot } from '../../utils/paths';
import type { IntegrationLibGeneratorSchema } from './schema';

export async function integrationLibGenerator(
  tree: Tree,
  options: IntegrationLibGeneratorSchema,
) {
  const fileName = toNames(options.name).fileName;
  const className = toNames(options.name).className;
  const projectRoot = apiLibRoot(fileName);
  const importPath = apiImportPath(fileName);
  const platformTag =
    fileName === 'stripe'
      ? 'payments'
      : fileName === 'steam'
        ? 'steam'
        : fileName === 'prisma'
          ? 'database'
          : 'integration';

  if (!tree.exists(joinPathFragments(projectRoot, 'project.json'))) {
    await jsLibraryGenerator(tree, {
      name: `api-${fileName}`,
      directory: projectRoot,
      importPath,
      tags: `scope:api,type:integration,platform:${platformTag}`,
      linter: 'eslint',
      unitTestRunner: 'vitest',
      skipFormat: true,
    });
  }

  generateFiles(tree, path.join(__dirname, 'files'), projectRoot, {
    fileName,
    className,
    integration: fileName,
    importPath,
    tmpl: '',
  });

  if (fileName === 'prisma') {
    generateFiles(
      tree,
      path.join(__dirname, 'files-prisma'),
      joinPathFragments(projectRoot, 'prisma'),
      { tmpl: '' },
    );
  }

  await formatFiles(tree);
}

export default integrationLibGenerator;
