import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HomeHero } from './components/home-hero';

describe('HomeHero', () => {
  it('renders hero heading', () => {
    render(<HomeHero />);
    expect(
      screen.getByRole('heading', { name: /Next-Gen Offline Game Activations/i }),
    ).toBeTruthy();
  });
});
