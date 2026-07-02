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
    xs: '0.75rem',
    sm: '0.9375rem',
    base: '1rem',
    md: '1.0625rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '2rem',
    '4xl': '3.5rem',
  },
  lineHeights: {
    tight: 1.1,
    snug: 1.35,
    normal: 1.5,
    body: 1.65,
    prose: 1.8,
  },
  letterSpacing: {
    tight: '-0.02em',
    wide: '0.1em',
  },
} as const;
