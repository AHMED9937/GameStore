import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameDetailStickyBuyBar } from './game-detail-sticky-buy-bar';

describe('GameDetailStickyBuyBar', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders price and Buy now in the dock', () => {
    class MockIntersectionObserver {
      observe = vi.fn();
      disconnect = vi.fn();
      unobserve = vi.fn();
      constructor(_callback: IntersectionObserverCallback) {}
    }
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

    render(
      <GameDetailStickyBuyBar
        game={{
          priceBase: '19.99',
          platform: 'steam',
          slug: 'demo-game',
          soldOut: false,
          discount: {
            percentOff: 25,
            priceSale: '14.99',
            endsAt: '2099-01-01T00:00:00.000Z',
            showCountdown: true,
          },
        }}
      />,
    );

    expect(screen.getByTestId('game-detail-sticky-buy')).toBeTruthy();
    expect(screen.getByTestId('game-price-display').textContent).toContain(
      '$14.99',
    );
    expect(screen.getByTestId('game-discount-badge').textContent).toMatch(
      /Save/i,
    );
    expect(screen.getByRole('link', { name: /Buy now/i }).getAttribute('href')).toBe(
      '/checkout?game=demo-game',
    );
  });
});
