export const colors = {
  bgDarker: '#06070d',
  bgDark: '#0a0c16',
  bgCard: 'rgba(15, 18, 36, 0.4)',
  primary: '#a855f7',
  secondary: '#06b6d4',
  accent: '#10b981',
  danger: '#ef4444',
  textMain: '#f3f4f6',
  textMuted: '#9ca3af',
} as const;

export const cssVarMap: Record<string, string> = {
  '--bg-darker': colors.bgDarker,
  '--bg-dark': colors.bgDark,
  '--bg-card': colors.bgCard,
  '--color-primary': colors.primary,
  '--color-secondary': colors.secondary,
  '--color-accent': colors.accent,
  '--color-danger': colors.danger,
  '--text-main': colors.textMain,
  '--text-muted': colors.textMuted,
};
