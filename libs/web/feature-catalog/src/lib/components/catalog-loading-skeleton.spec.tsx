import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CatalogLoadingSkeleton } from './catalog-loading-skeleton';

describe('CatalogLoadingSkeleton', () => {
  it('renders catalog loading skeleton with grid placeholders', () => {
    const { container } = render(<CatalogLoadingSkeleton />);
    expect(container.querySelector('[data-testid="catalog-loading-skeleton"]')).toBeTruthy();
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);
  });
});
