'use client';

import type { CSSProperties, ReactNode } from 'react';
import { cssVarMap } from './tokens/colors';
import './styles/globals.css';

export type ThemeProviderProps = {
  children: ReactNode;
  className?: string;
};

export function ThemeProvider({ children, className }: ThemeProviderProps) {
  const style = cssVarMap as CSSProperties;

  return (
    <div className={['gamestore-theme', className].filter(Boolean).join(' ')} style={style}>
      {children}
    </div>
  );
}
