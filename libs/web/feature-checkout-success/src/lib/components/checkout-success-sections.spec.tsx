import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CheckoutSuccessPending } from './checkout-success-sections';

describe('CheckoutSuccessPending', () => {
  it('uses shared loading state UI', () => {
    render(<CheckoutSuccessPending message="Waiting for webhook" />);
    expect(screen.getByTestId('checkout-success-pending')).toBeTruthy();
    const placeholders = screen.getByTestId('checkout-success-pending').querySelectorAll('[aria-hidden="true"]');
    expect(placeholders.length).toBeGreaterThan(0);
  });
});
