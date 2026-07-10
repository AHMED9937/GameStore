import type { HTMLAttributes } from 'react';
import { LoadingState } from './loading-state';

export type LoadingSurfaceProps = HTMLAttributes<HTMLDivElement> & {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'overlay' | 'section' | 'inline';
};

export function LoadingSurface(props: LoadingSurfaceProps) {
  return <LoadingState {...props} />;
}
