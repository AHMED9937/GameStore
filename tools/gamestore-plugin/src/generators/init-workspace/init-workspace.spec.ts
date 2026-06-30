import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration } from '@nx/devkit';

import { initWorkspaceGenerator } from './init-workspace';
import { InitWorkspaceGeneratorSchema } from './schema';

describe('init-workspace generator', () => {
  let tree: Tree;
  const options: InitWorkspaceGeneratorSchema = { name: 'test' };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await initWorkspaceGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'test');
    expect(config).toBeDefined();
  });
});
