import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GameDetailBuyPanel } from './game-detail-buy-panel';

const baseGame = {
  title: 'Demo Game',
  priceBase: '19.99',
  coverImage: '/cover.png',
  coverCardImage: null,
  platform: 'steam',
  slug: 'demo-game',
  soldOut: false,
  discount: null as null | {
    percentOff: number;
    priceSale: string;
    endsAt: string;
    showCountdown: boolean;
  },
};

describe('GameDetailBuyPanel', () => {
  it('renders shop-card cover, price, and buy CTA', () => {
    render(<GameDetailBuyPanel game={baseGame} />);
    const panel = screen.getByTestId('game-detail-buy-panel');
    expect(panel.textContent).toContain('$19.99');
    expect(screen.getByRole('link', { name: /Buy now/i })).toBeTruthy();
    expect(panel.querySelector('img')).toBeTruthy();
    expect(screen.queryByTestId('game-detail-platform-strip')).toBeNull();
  });

  it('shows one SAVE badge on cover without a duplicate −% pill', () => {
    render(
      <GameDetailBuyPanel
        game={{
          ...baseGame,
          discount: {
            percentOff: 20,
            priceSale: '15.99',
            endsAt: '2099-01-01T00:00:00.000Z',
            showCountdown: true,
          },
        }}
      />,
    );

    expect(screen.getByTestId('game-discount-badge').textContent).toMatch(/Save/i);
    const buyLink = screen.getByRole('link', { name: /Buy now/i });
    expect(buyLink.textContent).toContain('$15.99');
    expect(buyLink.textContent).toContain('was $19.99');
    expect(screen.queryByTestId('game-inline-save')).toBeNull();
    expect(screen.getByTestId('game-deal-countdown').textContent).toMatch(
      /Ends in|Ending soon/i,
    );
  });
});
