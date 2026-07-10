import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HomeStoreHighlight } from './home-store-highlight';

describe('HomeStoreHighlight', () => {
  it('renders a subtle since 2019 trust line', () => {
    render(<HomeStoreHighlight />);

    expect(screen.getByLabelText('Store trust')).toBeTruthy();
    expect(screen.getByText('Trusted storefront since 2019.')).toBeTruthy();
  });
});
