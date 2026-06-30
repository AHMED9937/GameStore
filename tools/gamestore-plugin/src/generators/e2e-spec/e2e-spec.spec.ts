import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration } from '@nx/devkit';

import { e2eSpecGenerator } from './e2e-spec';
import { E2eSpecGeneratorSchema } from './schema';

describe('e2e-spec generator', () => {
  let tree: Tree;
  const options: E2eSpecGeneratorSchema = { name: 'test' };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await e2eSpecGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'test');
    expect(config).toBeDefined();
  });
});
