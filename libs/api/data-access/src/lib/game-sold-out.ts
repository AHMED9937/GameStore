/** Effective sold-out when manually flagged, no active pool, or no open seat capacity. */
export function resolveSoldOut(
  manualSoldOut: boolean,
  hasActivePool: boolean,
  hasOpenCapacity = true,
): boolean {
  return manualSoldOut || !hasActivePool || !hasOpenCapacity;
}
