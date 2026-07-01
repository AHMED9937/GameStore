import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CheckoutSuccessPage } from './checkout-success-page';

describe('CheckoutSuccessPage', () => {
  it('renders error when session id is missing', () => {
    render(<CheckoutSuccessPage />);
    expect(screen.getByTestId('checkout-success-error').textContent).toContain(
      'Invalid checkout session.',
    );
  });

  it('renders demo license key when session id is present', () => {
    render(<CheckoutSuccessPage sessionId="cs_test_session_abc12345" />);
    expect(screen.getByTestId('checkout-success-ready')).toBeTruthy();
    expect(screen.getByTestId('checkout-license-key').textContent).toMatch(
      /^GS-DEMO-/,
    );
    expect(screen.getByTestId('checkout-success-demo-note')).toBeTruthy();
  });
});
