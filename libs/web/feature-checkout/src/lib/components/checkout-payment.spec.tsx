import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, type GameDetail } from '@gamestore/web/data-access';
import { CheckoutPayment } from './checkout-payment';

const { createCheckout, getPaymentsHealth } = vi.hoisted(() => ({
  createCheckout: vi.fn(),
  getPaymentsHealth: vi.fn(),
}));

vi.mock('@gamestore/web/data-access', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@gamestore/web/data-access')>();
  return {
    ...actual,
    createCheckout,
    getPaymentsHealth,
  };
});

const paidGame: Pick<GameDetail, 'id' | 'slug' | 'priceBase' | 'discount'> = {
  id: 'game-1',
  slug: 'demo-game-1',
  priceBase: '19.99',
  discount: null,
};

const freeGame: Pick<GameDetail, 'id' | 'slug' | 'priceBase' | 'discount'> = {
  id: 'game-2',
  slug: 'free-game-1',
  priceBase: '19.99',
  discount: {
    percentOff: 100,
    priceSale: '0.00',
    endsAt: new Date(Date.now() + 86_400_000).toISOString(),
    showCountdown: false,
  },
};

describe('CheckoutPayment', () => {
  beforeEach(() => {
    createCheckout.mockReset();
    getPaymentsHealth.mockReset();
  });

  it('renders the paid checkout button and copy for a priced game', () => {
    getPaymentsHealth.mockResolvedValue({
      status: 'ok',
      integration: 'stripe',
      env: { secretKey: 'valid', webhookSecret: 'valid', publishableKey: 'valid' },
    });

    render(<CheckoutPayment game={paidGame} />);

    const payButton = screen.getByTestId('checkout-pay-button');
    expect(payButton).toBeTruthy();
    expect(payButton.textContent).toContain('Pay now');
    expect(payButton.textContent).toContain('$19.99');
    expect(
      screen.getByText('You are one click away — pay securely and start playing.'),
    ).toBeTruthy();
    expect(screen.queryByTestId('checkout-savings')).toBeNull();
  });

  it('renders the free-claim button and copy for a 100%-off game', () => {
    render(<CheckoutPayment game={freeGame} />);

    const claimButton = screen.getByTestId('checkout-claim-button');
    expect(claimButton).toBeTruthy();
    expect(claimButton.textContent).toContain('Claim free game');
    expect(claimButton.textContent).toContain('Free');
    expect(claimButton.textContent).toContain('was $19.99');
    expect(
      screen.getByText('This game is free — claim it instantly, no payment required.'),
    ).toBeTruthy();
    expect(screen.getByTestId('checkout-savings').textContent).toContain(
      '$19.99 (100% off)',
    );
  });

  it('keeps the pay button locked until policies are accepted', () => {
    getPaymentsHealth.mockResolvedValue({
      status: 'ok',
      integration: 'stripe',
      env: { secretKey: 'valid', webhookSecret: 'valid', publishableKey: 'valid' },
    });
    render(<CheckoutPayment game={paidGame} />);

    const payButton = screen.getByTestId('checkout-pay-button');
    expect(payButton.hasAttribute('disabled')).toBe(true);

    fireEvent.click(screen.getByTestId('checkout-terms-checkbox'));
    expect(payButton.hasAttribute('disabled')).toBe(false);
  });

  it('shows an inline policy summary when a policy name is clicked', () => {
    getPaymentsHealth.mockResolvedValue({
      status: 'ok',
      integration: 'stripe',
      env: { secretKey: 'valid', webhookSecret: 'valid', publishableKey: 'valid' },
    });
    render(<CheckoutPayment game={paidGame} />);

    fireEvent.click(screen.getByText('Refund Policy'));
    expect(screen.getByTestId('checkout-policy-peek').textContent).toContain(
      'full refund',
    );
  });

  it('links each opened policy summary to its full legal page', () => {
    getPaymentsHealth.mockResolvedValue({
      status: 'ok',
      integration: 'stripe',
      env: { secretKey: 'valid', webhookSecret: 'valid', publishableKey: 'valid' },
    });
    render(<CheckoutPayment game={paidGame} />);

    fireEvent.click(screen.getByText('Privacy Policy'));
    const link = screen.getByTestId('checkout-policy-full-link');
    expect(link.getAttribute('href')).toBe('/privacy-policy');
  });

  it('shows a loading state while claiming a free game', async () => {
    createCheckout.mockReturnValue(new Promise(() => undefined));

    render(<CheckoutPayment game={freeGame} />);
    fireEvent.click(screen.getByTestId('checkout-terms-checkbox'));
    fireEvent.click(screen.getByTestId('checkout-claim-button'));

    expect(await screen.findByTestId('checkout-claim-loading')).toBeTruthy();
  });

  it('shows an error banner when checkout fails', async () => {
    createCheckout.mockRejectedValue(new Error('network down'));

    render(<CheckoutPayment game={freeGame} />);
    fireEvent.click(screen.getByTestId('checkout-terms-checkbox'));
    fireEvent.click(screen.getByTestId('checkout-claim-button'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeTruthy();
    });
    expect(screen.getByText('network down')).toBeTruthy();
    expect(screen.getByText('Retry')).toBeTruthy();
  });

  it('shows a sign-in prompt when the free claim requires authentication', async () => {
    createCheckout.mockRejectedValue(new ApiError(401, 'Sign in to claim this free game'));

    render(<CheckoutPayment game={freeGame} />);
    fireEvent.click(screen.getByTestId('checkout-terms-checkbox'));
    fireEvent.click(screen.getByTestId('checkout-claim-button'));

    await waitFor(() => {
      expect(screen.getByText('Sign in to continue')).toBeTruthy();
    });
  });
});
