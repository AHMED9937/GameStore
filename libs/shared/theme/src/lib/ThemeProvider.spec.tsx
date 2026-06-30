import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ThemeProvider } from './ThemeProvider';

describe('ThemeProvider', () => {
  it('renders children', () => {
    render(
      <ThemeProvider>
        <span>GameStore</span>
      </ThemeProvider>,
    );
    expect(screen.getByText('GameStore')).toBeTruthy();
  });

  it('applies gamestore-theme class', () => {
    const { container } = render(
      <ThemeProvider>
        <span>child</span>
      </ThemeProvider>,
    );
    expect(container.querySelector('.gamestore-theme')).toBeTruthy();
  });
});
