import {
  formatFiles,
  generateFiles,
  joinPathFragments,
  type Tree,
} from '@nx/devkit';
import { libraryGenerator as jsLibraryGenerator } from '@nx/js';
import * as path from 'path';
import { sharedImportPath } from '../../utils/names';
import { sharedLibRoot } from '../../utils/paths';
import type { SeoLibGeneratorSchema } from './schema';

const LIB_NAME = 'seo';
const PROJECT_NAME = 'shared-seo';

export async function seoLibGenerator(
  tree: Tree,
  _options: SeoLibGeneratorSchema,
) {
  const projectRoot = sharedLibRoot(LIB_NAME);
  const importPath = sharedImportPath('shared', LIB_NAME);

  if (!tree.exists(joinPathFragments(projectRoot, 'project.json'))) {
    await jsLibraryGenerator(tree, {
      name: PROJECT_NAME,
      directory: projectRoot,
      importPath,
      tags: 'scope:shared,type:integration',
      linter: 'eslint',
      unitTestRunner: 'vitest',
      skipFormat: true,
    });
  }

  generateFiles(tree, path.join(__dirname, 'files'), projectRoot, {
    importPath,
    tmpl: '',
  });

  if (tree.exists('apps/web')) {
    generateFiles(
      tree,
      path.join(__dirname, 'files-web'),
      'apps/web/src/app',
      { tmpl: '' },
    );
  }

  await formatFiles(tree);
}

export default seoLibGenerator;
