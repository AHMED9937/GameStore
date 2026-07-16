import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GameDealUrgency } from './game-deal-urgency';

describe('GameDealUrgency', () => {
  it('renders a top banner countdown with live tiles', () => {
    render(
      <GameDealUrgency
        variant="bannerLg"
        endsAt="2099-01-01T00:00:00.000Z"
        showCountdown
      />,
    );

    expect(screen.getByTestId('game-deal-urgency')).toBeTruthy();
    expect(screen.getByTestId('game-deal-countdown').textContent).toMatch(
      /Ends in|Ending soon/i,
    );
  });

  it('returns null when countdown is off', () => {
    const { container } = render(<GameDealUrgency showCountdown={false} />);
    expect(container.querySelector('[data-testid="game-deal-urgency"]')).toBeNull();
  });
});
