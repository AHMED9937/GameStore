import {
  formatFiles,
  generateFiles,
  joinPathFragments,
  names,
  type Tree,
} from '@nx/devkit';
import { libraryGenerator as reactLibraryGenerator } from '@nx/react';
import * as path from 'path';
import { featureImportPath, toNames } from '../../utils/names';
import { webFeatureRoot } from '../../utils/paths';
import type { WebFeatureGeneratorSchema } from './schema';

export async function webFeatureGenerator(
  tree: Tree,
  options: WebFeatureGeneratorSchema,
) {
  const fileName = toNames(options.name).fileName;
  const projectRoot = webFeatureRoot(fileName);
  const importPath = featureImportPath(options.name);
  const pageNames = names(`${fileName}-page`);
  const route = options.route ?? `/${fileName}`;
  const routeSegments = route.replace(/^\//, '').split('/');
  const appPageDir = joinPathFragments('apps/web/src/app', ...routeSegments);

  if (!tree.exists(joinPathFragments(projectRoot, 'project.json'))) {
    await reactLibraryGenerator(tree, {
      name: `feature-${fileName}`,
      directory: projectRoot,
      importPath,
      tags: 'scope:web,type:feature',
      linter: 'eslint',
      style: 'css',
      unitTestRunner: 'vitest',
      skipFormat: true,
    });
  }

  generateFiles(tree, path.join(__dirname, 'files'), projectRoot, {
    ...pageNames,
    fileName,
    className: pageNames.className,
    route,
    tmpl: '',
  });

  if (tree.exists('apps/web')) {
    generateFiles(tree, path.join(__dirname, 'files-app'), appPageDir, {
      ...pageNames,
      fileName,
      className: pageNames.className,
      importPath,
      tmpl: '',
    });
  }

  await formatFiles(tree);
}

export default webFeatureGenerator;
