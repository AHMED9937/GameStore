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
import type { UiLibGeneratorSchema } from './schema';

const LIB_NAME = 'ui';
const PROJECT_NAME = 'shared-ui';
const ALL_COMPONENTS = [
  'text',
  'heading',
  'button',
  'card',
  'badge',
  'input',
  'container',
  'stack',
  'empty-state',
];

export async function uiLibGenerator(tree: Tree, options: UiLibGeneratorSchema) {
  const projectRoot = sharedLibRoot(LIB_NAME);
  const importPath = sharedImportPath('shared', LIB_NAME);
  const componentNames = toNames(options.name);
  const components =
    options.name === 'all' ? ALL_COMPONENTS : [componentNames.fileName];

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

  for (const component of components) {
    const names = toNames(component);
    generateFiles(tree, path.join(__dirname, 'files'), projectRoot, {
      ...names,
      componentName: names.className,
      fileName: names.fileName,
      tmpl: '',
    });
  }

  const indexPath = joinPathFragments(projectRoot, 'src/index.ts');
  const exports = components
    .map((c) => `export * from './lib/${toNames(c).fileName}';`)
    .join('\n');
  tree.write(indexPath, `${exports}\n`);

  await formatFiles(tree);
}

export default uiLibGenerator;
