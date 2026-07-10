import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  Skeleton,
  SkeletonBanner,
  SkeletonButton,
  SkeletonPanel,
  SkeletonText,
} from './skeleton';

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

  it('renders helper skeleton variants', () => {
    const { container } = render(
      <div>
        <SkeletonText data-testid="text-skeleton" />
        <SkeletonButton data-testid="button-skeleton" />
        <SkeletonBanner data-testid="banner-skeleton" />
        <SkeletonPanel data-testid="panel-skeleton" />
      </div>,
    );

    expect(container.querySelector('[data-testid="text-skeleton"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="button-skeleton"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="banner-skeleton"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="panel-skeleton"]')).toBeTruthy();
  });
});
