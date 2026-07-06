import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Spinner } from './spinner';

describe('Spinner', () => {
  it('renders with role status and aria-label', () => {
    render(<Spinner />);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeTruthy();
  });

  it('applies size and className props', () => {
    render(<Spinner size="lg" className="custom-spinner" data-testid="spinner" />);
    const spinner = screen.getByTestId('spinner');
    expect(spinner.className).toContain('custom-spinner');
    expect(spinner.className).toMatch(/spinnerLg/);
  });
});
