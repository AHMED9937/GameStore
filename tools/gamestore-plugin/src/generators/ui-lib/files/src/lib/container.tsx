import type { HTMLAttributes } from 'react';

export function Container({
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div {...props}>{children}</div>;
}
