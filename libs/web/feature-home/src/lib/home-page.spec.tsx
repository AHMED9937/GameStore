import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HomeHero } from './components/home-hero';

describe('HomeHero', () => {
  it('renders hero heading and lead copy', () => {
    render(<HomeHero />);
    expect(
      screen.getByRole('heading', { name: /Next-Gen Offline Game Activations/i }),
    ).toBeTruthy();
    expect(screen.getByText(/Curated PC titles with secure checkout/i)).toBeTruthy();
    expect(screen.getByRole('link', { name: /Explore Games/i }).getAttribute('href')).toBe(
      '/shop',
    );
  });
});
