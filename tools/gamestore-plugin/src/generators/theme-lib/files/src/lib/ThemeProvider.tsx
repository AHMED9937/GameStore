'use client';

import { cssVarMap } from './tokens/colors';
import './styles/globals.css';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const style = cssVarMap as React.CSSProperties;

  return (
    <div className="dark gamestore-theme" style={style}>
      {children}
    </div>
  );
}
