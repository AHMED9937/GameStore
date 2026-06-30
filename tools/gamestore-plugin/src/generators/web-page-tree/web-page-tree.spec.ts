import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration } from '@nx/devkit';

import { webPageTreeGenerator } from './web-page-tree';
import { WebPageTreeGeneratorSchema } from './schema';

describe('web-page-tree generator', () => {
  let tree: Tree;
  const options: WebPageTreeGeneratorSchema = { name: 'test' };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await webPageTreeGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'test');
    expect(config).toBeDefined();
  });
});
