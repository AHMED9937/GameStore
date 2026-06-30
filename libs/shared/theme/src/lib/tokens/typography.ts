export const typography = {
  fontBody: 'var(--font-body)',
  fontDisplay: 'var(--font-display)',
  weights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  sizes: {
    xs: '0.6875rem',
    sm: '0.875rem',
    base: '1rem',
    md: '0.9375rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '2rem',
    '4xl': '3.5rem',
  },
  lineHeights: {
    tight: 1.1,
    snug: 1.3,
    normal: 1.5,
    relaxed: 1.6,
  },
  letterSpacing: {
    tight: '-0.02em',
    wide: '0.1em',
  },
} as const;
