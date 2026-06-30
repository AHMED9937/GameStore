import {
  formatFiles,
  joinPathFragments,
  names,
  type Tree,
} from '@nx/devkit';
import { toNames } from '../../utils/names';
import { webFeatureRoot } from '../../utils/paths';
import type { WebPageTreeGeneratorSchema } from './schema';

const DEFAULT_COMPONENTS = ['hero', 'filters', 'grid', 'card'];

export async function webPageTreeGenerator(
  tree: Tree,
  options: WebPageTreeGeneratorSchema,
) {
  const page = toNames(options.page).fileName;
  const projectRoot = joinPathFragments(
    webFeatureRoot(page),
    'src/lib/components',
  );
  const components = options.components?.length
    ? options.components
    : DEFAULT_COMPONENTS;

  for (const component of components) {
    const componentNames = names(component);
    const exportName = `${names(page).className}${componentNames.className}`;
    const filePath = joinPathFragments(
      projectRoot,
      `${page}-${componentNames.fileName}.tsx`,
    );

    tree.write(
      filePath,
      `export function ${exportName}() {
  return <div>${page} / ${componentNames.fileName}</div>;
}
`,
    );
  }

  await formatFiles(tree);
}

export default webPageTreeGenerator;
