export type AdminAsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'setup'; message: string }
  | { status: 'success'; data: T }
  | { status: 'empty' }
  | { status: 'error'; message: string };
