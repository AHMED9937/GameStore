import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NavigationProgress } from './navigation-progress';

const { pathname } = vi.hoisted(() => ({ pathname: { current: '/' } }));

vi.mock('next/navigation', () => ({
  usePathname: () => pathname.current,
}));

describe('NavigationProgress', () => {
  it('hides itself after completion', () => {
    vi.useFakeTimers();
    pathname.current = '/';
    const { rerender, container } = render(<NavigationProgress />);
    pathname.current = '/shop';
    rerender(<NavigationProgress />);
    expect(container.querySelector('[data-testid="navigation-progress"]')).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(container.querySelector('[data-testid="navigation-progress"]')).toBeNull();
    vi.useRealTimers();
  });

  it('is hidden on initial render', () => {
    pathname.current = '/';
    const { container } = render(<NavigationProgress />);
    expect(container.querySelector('[data-testid="navigation-progress"]')).toBeNull();
  });

  it('shows progress bar when pathname changes', () => {
    pathname.current = '/';
    const { rerender, container } = render(<NavigationProgress />);
    pathname.current = '/shop';
    rerender(<NavigationProgress />);
    expect(container.querySelector('[data-testid="navigation-progress"]')).toBeTruthy();
  });
});
