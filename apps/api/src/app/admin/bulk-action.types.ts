import { BadRequestException } from '@nestjs/common';

export type BulkActionFailure = {
  id: string;
  reason: string;
};

export type BulkActionResult = {
  succeeded: string[];
  failed: BulkActionFailure[];
};

export function normalizeBulkIds(ids: string[]): string[] {
  const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  if (unique.length === 0) {
    throw new BadRequestException('ids must contain at least one value');
  }
  if (unique.length > 100) {
    throw new BadRequestException('ids cannot contain more than 100 values');
  }
  return unique;
}

export function runBulkIds(
  ids: string[],
  handler: (id: string) => Promise<void>,
): Promise<BulkActionResult> {
  const result: BulkActionResult = { succeeded: [], failed: [] };

  return ids.reduce(async (previous, id) => {
    await previous;
    try {
      await handler(id);
      result.succeeded.push(id);
    } catch (error) {
      result.failed.push({
        id,
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, Promise.resolve()).then(() => result);
}

export function bulkFailureReason(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error';
}
