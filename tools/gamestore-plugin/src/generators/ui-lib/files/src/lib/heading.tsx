import type { HTMLAttributes } from 'react';

type Level = 'h1' | 'h2' | 'h3';

export function Heading({
  level = 'h2',
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement> & { level?: Level }) {
  const Tag = level;
  return <Tag {...props}>{children}</Tag>;
}
