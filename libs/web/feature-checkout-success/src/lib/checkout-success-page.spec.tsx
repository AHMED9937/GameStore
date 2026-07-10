import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CheckoutSuccessPage } from './checkout-success-page';

const fetchOrderBySession = vi.fn();
const useAuth = vi.fn();

vi.mock('@clerk/nextjs', () => ({
  useAuth: () => useAuth(),
}));

vi.mock('@gamestore/web/data-access', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@gamestore/web/data-access')>();
  return {
    ...actual,
    fetchOrderBySession: (...args: unknown[]) => fetchOrderBySession(...args),
  };
});

describe('CheckoutSuccessPage', () => {
  beforeEach(() => {
    fetchOrderBySession.mockReset();
    useAuth.mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
      getToken: vi.fn().mockResolvedValue(null),
    });
  });

  it('renders error when session id is missing', () => {
    render(<CheckoutSuccessPage />);
    expect(screen.getByTestId('checkout-success-error').textContent).toContain(
      'Invalid checkout session.',
    );
  });

  it('renders loading until Clerk is ready', () => {
    useAuth.mockReturnValue({
      isLoaded: false,
      isSignedIn: false,
      getToken: vi.fn(),
    });

    render(<CheckoutSuccessPage sessionId="cs_test_session_abc12345" />);

    expect(screen.getByTestId('checkout-success-loading')).toBeTruthy();
    expect(fetchOrderBySession).not.toHaveBeenCalled();
  });

  it('renders loading then success with real license', async () => {
    fetchOrderBySession.mockResolvedValue({
      status: 'completed',
      order: {
        id: 'order-1',
        amount: '9.99',
        currency: 'usd',
        buyerEmail: null,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      license: {
        licenseKey: 'GS-REAL-KEY',
        status: 'available',
        game: { id: 'game-1', title: 'Demo Game', slug: 'demo-game' },
      },
    });

    render(<CheckoutSuccessPage sessionId="cs_test_session_abc12345" />);

    expect(screen.getByTestId('checkout-success-loading')).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByTestId('checkout-success-ready')).toBeTruthy();
    });

    expect(screen.getByTestId('checkout-license-key').textContent).toBe('GS-REAL-KEY');
    expect(screen.queryByTestId('checkout-success-demo-note')).toBeNull();
  });

  it('renders pending state while order is processing', async () => {
    fetchOrderBySession.mockResolvedValue({
      status: 'pending',
      message: 'Payment received. Issuing license…',
    });

    render(<CheckoutSuccessPage sessionId="cs_test_pending" />);

    await waitFor(() => {
      expect(screen.getByTestId('checkout-success-pending')).toBeTruthy();
    });

    const pendingRoot = screen.getByTestId('checkout-success-pending');
    expect(pendingRoot.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);
  });

  it('renders error for failed lookup', async () => {
    fetchOrderBySession.mockResolvedValue({
      status: 'failed',
      message: 'Payment was not completed.',
    });

    render(<CheckoutSuccessPage sessionId="cs_test_failed" />);

    await waitFor(() => {
      expect(screen.getByTestId('checkout-success-error').textContent).toContain(
        'Payment was not completed.',
      );
    });
  });
});
