import type { BulkActionResult } from '@gamestore/web/data-access';

export function formatBulkActionSummary(
  result: BulkActionResult,
  verb: string,
): string {
  const parts: string[] = [];

  if (result.succeeded.length > 0) {
    parts.push(`${result.succeeded.length} ${verb}`);
  }

  if (result.failed.length > 0) {
    const reasons = result.failed
      .slice(0, 3)
      .map((failure) => `${failure.id}: ${failure.reason}`)
      .join('; ');
    const suffix =
      result.failed.length > 3
        ? ` (+${result.failed.length - 3} more)`
        : '';
    parts.push(`${result.failed.length} failed (${reasons}${suffix})`);
  }

  return parts.join(', ');
}
