/** Nexus Pass / GameStore — Cybernetic Amethyst & Aqua Neon */
export const colors = {
  bgDarker: '#06070d',
  bgDark: '#0a0c16',
  bgCard: 'rgba(15, 18, 36, 0.4)',
  bgCardHover: 'rgba(26, 30, 56, 0.6)',
  bgInput: 'rgba(10, 12, 22, 0.8)',
  bgHeader: 'rgba(6, 7, 13, 0.8)',

  primary: '#a855f7',
  primaryGlow: 'rgba(168, 85, 247, 0.15)',
  secondary: '#06b6d4',
  secondaryGlow: 'rgba(6, 182, 212, 0.2)',
  accent: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',

  borderLight: 'rgba(255, 255, 255, 0.05)',
  borderHover: 'rgba(168, 85, 247, 0.4)',

  textMain: '#f3f4f6',
  textMuted: '#9ca3af',
  textDim: '#6b7280',

  white: '#ffffff',
  steam: '#1b2838',
} as const;

export const gradients = {
  brand: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
  glow: `linear-gradient(135deg, rgba(168, 85, 247, 0.5) 0%, rgba(6, 182, 212, 0.5) 100%)`,
  heroText: 'linear-gradient(135deg, #fff 40%, #a855f7 100%)',
  cardOverlay:
    'linear-gradient(180deg, transparent 0%, rgba(6, 7, 13, 0.6) 100%)',
  ambientPurple:
    'radial-gradient(circle at 10% 20%, rgba(168, 85, 247, 0.05) 0%, transparent 40%)',
  ambientCyan:
    'radial-gradient(circle at 90% 80%, rgba(6, 182, 212, 0.05) 0%, transparent 40%)',
} as const;

export const cssVarMap: Record<string, string> = {
  '--bg-darker': colors.bgDarker,
  '--bg-dark': colors.bgDark,
  '--bg-card': colors.bgCard,
  '--bg-card-hover': colors.bgCardHover,
  '--bg-input': colors.bgInput,
  '--bg-header': colors.bgHeader,
  '--color-primary': colors.primary,
  '--color-primary-glow': colors.primaryGlow,
  '--color-secondary': colors.secondary,
  '--color-secondary-glow': colors.secondaryGlow,
  '--color-accent': colors.accent,
  '--color-danger': colors.danger,
  '--color-warning': colors.warning,
  '--border-light': colors.borderLight,
  '--border-hover': colors.borderHover,
  '--text-main': colors.textMain,
  '--text-muted': colors.textMuted,
  '--text-dim': colors.textDim,
  '--gradient-brand': gradients.brand,
  '--gradient-glow': gradients.glow,
  '--gradient-hero-text': gradients.heroText,
  '--transition-smooth': 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
  '--font-body': "'Plus Jakarta Sans', sans-serif",
  '--font-display': "'Space Grotesk', sans-serif",
  '--shadow-glow': '0 0 20px var(--color-primary-glow)',
  '--shadow-card-hover': '0 15px 35px var(--color-primary-glow)',
  '--radius-sm': '0.5rem',
  '--radius-md': '0.625rem',
  '--radius-lg': '1rem',
  '--radius-xl': '1.25rem',
};

export const colorTokenNames = Object.keys(cssVarMap).filter((k) =>
  k.startsWith('--color-'),
);
