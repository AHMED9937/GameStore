import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LoadingState } from './loading-state';

describe('LoadingState', () => {
  it('renders status with default label', () => {
    render(<LoadingState data-testid="loading-state" />);
    expect(screen.getByTestId('loading-state')).toBeTruthy();
    expect(screen.getByText('Loading…')).toBeTruthy();
  });

  it('applies overlay variant class', () => {
    render(<LoadingState variant="overlay" data-testid="loading-state" />);
    expect(screen.getByTestId('loading-state').className).toMatch(/loadingOverlay/);
  });
});
