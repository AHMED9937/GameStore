import type { HTMLAttributes } from 'react';

export function Stack({ children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props}>{children}</div>;
}
