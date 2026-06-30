import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AdminAsyncView } from './admin-async-view';

describe('AdminAsyncView', () => {
  it('renders loading for idle state', () => {
    render(
      <AdminAsyncView state={{ status: 'idle' }}>{() => 'data'}</AdminAsyncView>,
    );
    expect(screen.getByText('Loading…')).toBeTruthy();
  });

  it('renders loading for loading state', () => {
    render(
      <AdminAsyncView state={{ status: 'loading' }}>
        {() => 'data'}
      </AdminAsyncView>,
    );
    expect(screen.getByText('Loading…')).toBeTruthy();
  });

  it('renders setup banner with message', () => {
    render(
      <AdminAsyncView
        state={{ status: 'setup', message: 'Admin games — not implemented yet' }}
      >
        {() => 'data'}
      </AdminAsyncView>,
    );
    expect(screen.getByTestId('admin-setup-banner').textContent).toBe(
      'Admin games — not implemented yet',
    );
  });

  it('renders error banner with message', () => {
    render(
      <AdminAsyncView state={{ status: 'error', message: 'Forbidden' }}>
        {() => 'data'}
      </AdminAsyncView>,
    );
    expect(screen.getByTestId('admin-error-banner').textContent).toBe('Forbidden');
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
