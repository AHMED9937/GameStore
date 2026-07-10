import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CheckoutAsyncView } from './checkout-async-view';

describe('CheckoutAsyncView', () => {
  it('renders loading with shared loading state', () => {
    render(
      <CheckoutAsyncView state={{ status: 'loading' }}>
        {() => <div />}
      </CheckoutAsyncView>,
    );
    expect(screen.getByTestId('checkout-summary-loading')).toBeTruthy();
    expect(screen.queryByText('Loading order summary…')).toBeNull();
  });

  it('renders retry action on error', () => {
    const onRetry = vi.fn();
    render(
      <CheckoutAsyncView state={{ status: 'error', message: 'Oops' }} onRetry={onRetry}>
        {() => <div />}
      </CheckoutAsyncView>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
