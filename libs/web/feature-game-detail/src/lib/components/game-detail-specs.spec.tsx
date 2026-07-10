import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GameDetailSpecs } from './game-detail-specs';

const minimum = {
  requires64Bit: true,
  os: 'Windows 10/11 64-bit',
  processor: 'Intel Core i5-8400',
  memory: '8 GB RAM',
  graphics: 'NVIDIA GTX 1060',
  storage: '45 GB available space',
  additionalNotes: null,
};

const recommended = {
  requires64Bit: true,
  os: 'Windows 10/11 64-bit',
  processor: 'Intel Core i7-10700',
  memory: '16 GB RAM',
  graphics: 'NVIDIA RTX 3060',
  storage: '45 GB available space (SSD recommended)',
  additionalNotes: null,
};

describe('GameDetailSpecs', () => {
  it('renders structured minimum and recommended panels', () => {
    render(<GameDetailSpecs minimum={minimum} recommended={recommended} />);

    expect(screen.getByText('Minimum')).toBeTruthy();
    expect(screen.getByText('Recommended')).toBeTruthy();
    expect(screen.getAllByText('Requires a 64-bit processor and operating system')).toHaveLength(2);
    expect(screen.getAllByText('Windows 10/11 64-bit')).toHaveLength(2);
    expect(screen.getByText('Intel Core i7-10700')).toBeTruthy();
  });

  it('shows empty state when requirements are missing', () => {
    render(<GameDetailSpecs />);
    expect(
      screen.getByText('System requirements have not been published for this title yet.'),
    ).toBeTruthy();
  });
});
