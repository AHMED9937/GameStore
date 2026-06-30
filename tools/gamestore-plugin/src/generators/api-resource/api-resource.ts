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
import type { ApiResourceGeneratorSchema } from './schema';

export async function apiResourceGenerator(
  tree: Tree,
  options: ApiResourceGeneratorSchema,
) {
  const fileName = toNames(options.resource).fileName;
  const className = toNames(options.resource).className;
  const projectRoot = apiLibRoot(fileName);
  const importPath = apiImportPath(fileName);

  if (!tree.exists(joinPathFragments(projectRoot, 'project.json'))) {
    await jsLibraryGenerator(tree, {
      name: `api-${fileName}`,
      directory: projectRoot,
      importPath,
      tags: 'scope:api,type:data-access',
      linter: 'eslint',
      unitTestRunner: 'vitest',
      skipFormat: true,
    });
  }

  generateFiles(tree, path.join(__dirname, 'files'), projectRoot, {
    fileName,
    className,
    resource: fileName,
    importPath,
    tmpl: '',
  });

  await formatFiles(tree);
}

export default apiResourceGenerator;
