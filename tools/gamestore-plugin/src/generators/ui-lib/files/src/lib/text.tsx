import type { HTMLAttributes } from 'react';

export function Text({ children, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span {...props}>{children}</span>;
}
