import type { HTMLAttributes } from 'react';

export function Badge({ children, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span {...props}>{children}</span>;
}
