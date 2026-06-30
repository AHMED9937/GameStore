import {
  formatFiles,
  generateFiles,
  joinPathFragments,
  type Tree,
} from '@nx/devkit';
import { libraryGenerator as reactLibraryGenerator } from '@nx/react';
import * as path from 'path';
import { sharedImportPath, toNames } from '../../utils/names';
import { sharedLibRoot } from '../../utils/paths';
import type { ThemeLibGeneratorSchema } from './schema';

const LIB_NAME = 'theme';
const PROJECT_NAME = 'shared-theme';

export async function themeLibGenerator(
  tree: Tree,
  _options: ThemeLibGeneratorSchema,
) {
  const projectRoot = sharedLibRoot(LIB_NAME);
  const importPath = sharedImportPath('shared', LIB_NAME);
  const names = toNames(LIB_NAME);

  if (!tree.exists(joinPathFragments(projectRoot, 'project.json'))) {
    await reactLibraryGenerator(tree, {
      name: PROJECT_NAME,
      directory: projectRoot,
      importPath,
      tags: 'scope:shared,type:ui',
      linter: 'eslint',
      style: 'css',
      unitTestRunner: 'vitest',
      skipFormat: true,
    });
  }

  generateFiles(tree, path.join(__dirname, 'files'), projectRoot, {
    ...names,
    importPath,
    tmpl: '',
  });

  await formatFiles(tree);
}

export default themeLibGenerator;
