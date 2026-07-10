import type { AdminAsyncState } from '../types/admin-async-state';

export function resolveAdminTableRows<T>(
  isControlled: boolean,
  state: AdminAsyncState<T[]>,
  syncedRows: T[],
): T[] {
  if (isControlled && state.status === 'success') {
    return state.data;
  }
  if (syncedRows.length > 0) {
    return syncedRows;
  }
  if (state.status === 'success') {
    return state.data;
  }
  return [];
}
