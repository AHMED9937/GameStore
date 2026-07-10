import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GameDetailLoadingSkeleton } from './game-detail-loading-skeleton';

describe('GameDetailLoadingSkeleton', () => {
  it('renders as busy skeleton container', () => {
    render(<GameDetailLoadingSkeleton />);
    const root = screen.getByTestId('game-detail-loading-skeleton');
    expect(root.getAttribute('aria-busy')).toBe('true');
  });
});
