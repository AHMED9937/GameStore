import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GameDetailBuyButton } from './game-detail-buy-cta';

describe('GameDetailBuyButton', () => {
  it('renders disabled sold out button when soldOut is true', () => {
    render(<GameDetailBuyButton slug="demo-game" soldOut />);
    const button = screen.getByRole('button', { name: 'Sold out' });
    expect(button).toBeTruthy();
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  it('renders buy link when soldOut is false', () => {
    render(<GameDetailBuyButton slug="demo-game" soldOut={false} />);
    const link = screen.getByRole('link', { name: /Buy now/i });
    expect(link.getAttribute('href')).toBe('/checkout?game=demo-game');
  });
});
