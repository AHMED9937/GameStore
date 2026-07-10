/** Effective sold-out when manually flagged or no active pool account is linked. */
export function resolveSoldOut(
  manualSoldOut: boolean,
  hasActivePool: boolean,
): boolean {
  return manualSoldOut || !hasActivePool;
}
