import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { GameDetail } from '@gamestore/web/data-access';
import { CheckoutPage } from './checkout-page';

const mockGame: GameDetail = {
  id: 'game-1',
  slug: 'demo-game-1',
  title: 'Demo Game',
  description: 'A test game',
  platform: 'steam',
  priceBase: '19.99',
  coverImage: null,
  genres: ['Action'],
  releaseDate: '2025-01-01',
  requirementsMin: null,
  requirementsRecommended: null,
  media: [],
};

describe('CheckoutPage', () => {
  it('renders idle state when no game is selected', () => {
    render(<CheckoutPage gameState={{ status: 'idle' }} />);
    expect(screen.getByTestId('checkout-summary-idle')).toBeTruthy();
    expect(screen.getByText('Select a game from the shop.')).toBeTruthy();
  });

  it('renders loading state', () => {
    render(<CheckoutPage gameState={{ status: 'loading' }} />);
    expect(screen.getByTestId('checkout-summary-loading')).toBeTruthy();
  });

  it('renders error state with message', () => {
    render(
      <CheckoutPage
        gameState={{ status: 'error', message: 'This game could not be found.' }}
      />,
    );
    expect(screen.getByTestId('checkout-summary-error').textContent).toContain(
      'This game could not be found.',
    );
  });

  it('renders summary and pay button when game is loaded', () => {
    render(
      <CheckoutPage
        gameSlug="demo-game-1"
        gameState={{ status: 'success', data: mockGame }}
      />,
    );
    expect(screen.getByTestId('checkout-summary-ready')).toBeTruthy();
    expect(screen.getByText('Demo Game')).toBeTruthy();
    expect(screen.getByTestId('checkout-pay-button')).toBeTruthy();
  });

  it('shows cancelled banner when returning from Stripe', () => {
    render(
      <CheckoutPage
        cancelled
        gameState={{ status: 'success', data: mockGame }}
      />,
    );
    expect(screen.getByTestId('checkout-cancelled-banner')).toBeTruthy();
  });
});
