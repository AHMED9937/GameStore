import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HomeHeroShowcaseSkeleton } from './home-hero-showcase-skeleton';

describe('HomeHeroShowcaseSkeleton', () => {
  it('renders showcase skeleton fallback', () => {
    render(<HomeHeroShowcaseSkeleton />);
    expect(screen.getByTestId('home-hero-showcase-skeleton')).toBeTruthy();
  });
});
