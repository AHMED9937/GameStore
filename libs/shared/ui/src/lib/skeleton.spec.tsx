import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Skeleton } from './skeleton';

describe('Skeleton', () => {
  it('renders with aria-hidden', () => {
    const { container } = render(<Skeleton data-testid="skeleton" />);
    const skeleton = container.querySelector('[data-testid="skeleton"]');
    expect(skeleton?.getAttribute('aria-hidden')).toBe('true');
  });

  it('applies width and height styles', () => {
    const { container } = render(<Skeleton width="100px" height={48} data-testid="skeleton" />);
    const skeleton = container.querySelector('[data-testid="skeleton"]') as HTMLElement;
    expect(skeleton.style.width).toBe('100px');
    expect(skeleton.style.height).toBe('48px');
  });
});
