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
import type { ApiModuleGeneratorSchema } from './schema';

export async function apiModuleGenerator(
  tree: Tree,
  options: ApiModuleGeneratorSchema,
) {
  const fileName = toNames(options.name).fileName;
  const className = toNames(options.name).className;
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
    importPath,
    tmpl: '',
  });

  await formatFiles(tree);
}

export default apiModuleGenerator;
