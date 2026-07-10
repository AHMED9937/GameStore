import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AdminAsyncView } from './admin-async-view';

describe('AdminAsyncView', () => {
  it('renders loading for idle state', () => {
    render(
      <AdminAsyncView state={{ status: 'idle' }}>{() => 'data'}</AdminAsyncView>,
    );
    expect(screen.getByTestId('admin-async-loading')).toBeTruthy();
  });

  it('renders loading for loading state', () => {
    render(
      <AdminAsyncView state={{ status: 'loading' }}>
        {() => 'data'}
      </AdminAsyncView>,
    );
    expect(screen.getByTestId('admin-async-loading')).toBeTruthy();
  });

  it('renders setup banner with message', () => {
    render(
      <AdminAsyncView
        state={{ status: 'setup', message: 'Admin games not implemented yet' }}
      >
        {() => 'data'}
      </AdminAsyncView>,
    );
    expect(screen.getByTestId('admin-setup-banner').textContent).toBe(
      'Admin games not implemented yet',
    );
  });

  it('renders error banner with message', () => {
    render(
      <AdminAsyncView state={{ status: 'error', message: 'Forbidden' }}>
        {() => 'data'}
      </AdminAsyncView>,
    );
    expect(screen.getByTestId('admin-error-banner').textContent).toContain('Forbidden');
  });

  it('renders retry button when onRetry is provided', () => {
    render(
      <AdminAsyncView
        state={{ status: 'error', message: 'Unavailable' }}
        onRetry={() => undefined}
      >
        {() => 'data'}
      </AdminAsyncView>,
    );
    expect(screen.getByTestId('admin-error-retry')).toBeTruthy();
  });

  it('renders empty state', () => {
    render(
      <AdminAsyncView state={{ status: 'empty' }} emptyMessage="No games yet.">
        {() => 'data'}
      </AdminAsyncView>,
    );
    expect(screen.getByText('No games yet.')).toBeTruthy();
  });

  it('renders children for success state', () => {
    render(
      <AdminAsyncView state={{ status: 'success', data: { count: 3 } }}>
        {(data) => <span>Count: {data.count}</span>}
      </AdminAsyncView>,
    );
    expect(screen.getByText('Count: 3')).toBeTruthy();
  });
});
