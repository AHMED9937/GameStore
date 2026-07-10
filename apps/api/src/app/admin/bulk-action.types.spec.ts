import { describe, expect, it } from 'vitest';
import { runBulkIds } from './bulk-action.types';

describe('runBulkIds', () => {
  it('collects successes and failures independently', async () => {
    const result = await runBulkIds(['a', 'b', 'c'], async (id) => {
      if (id === 'b') {
        throw new Error('blocked');
      }
    });

    expect(result).toEqual({
      succeeded: ['a', 'c'],
      failed: [{ id: 'b', reason: 'blocked' }],
    });
  });
});
