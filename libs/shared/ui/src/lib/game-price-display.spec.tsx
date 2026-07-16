import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GameDiscountBadge, GamePriceDisplay } from './game-price-display';

describe('GamePriceDisplay', () => {
  it('renders a single base price when not discounted', () => {
    render(<GamePriceDisplay priceBaseLabel="$19.99" />);
    expect(screen.getByTestId('game-price-display').textContent).toContain('$19.99');
    expect(screen.queryByTestId('game-discount-badge')).toBeNull();
  });

  it('shows sale and was-price in one horizontal deal row', () => {
    render(
      <GamePriceDisplay
        priceBaseLabel="$19.99"
        priceSaleLabel="$15.99"
        percentOff={20}
        showPercentInline
      />,
    );
    const block = screen.getByTestId('game-price-display');
    expect(block.textContent).toContain('$15.99');
    expect(block.textContent).toContain('Was');
    expect(block.textContent).toContain('$19.99');
    expect(screen.getByTestId('game-inline-save').textContent).toContain('−20%');
  });
});

describe('GameDiscountBadge', () => {
  it('renders SAVE marketing badge', () => {
    render(<GameDiscountBadge percentOff={30} />);
    expect(screen.getByTestId('game-discount-badge').textContent).toMatch(/Save/i);
    expect(screen.getByTestId('game-discount-badge').textContent).toContain('30%');
  });
});
