import { colors, gradients } from './tokens/colors';
import { radius } from './tokens/radius';
import { shadows } from './tokens/shadows';
import { spacing, layout } from './tokens/spacing';
import { typography } from './tokens/typography';

/** Tailwind preset wire when Tailwind is added to apps/web */
export const gamestoreTailwindPreset = {
  theme: {
    extend: {
      colors: {
        background: {
          darker: colors.bgDarker,
          dark: colors.bgDark,
          card: colors.bgCard,
          input: colors.bgInput,
        },
        primary: colors.primary,
        secondary: colors.secondary,
        accent: colors.accent,
        danger: colors.danger,
        muted: colors.textMuted,
        dim: colors.textDim,
      },
      fontFamily: {
        sans: [typography.fontBody, 'system-ui', 'sans-serif'],
        display: [typography.fontDisplay, typography.fontBody, 'system-ui', 'sans-serif'],
        mono: [typography.fontMono],
      },
      fontSize: {
        xs: typography.sizes.xs,
        sm: typography.sizes.sm,
        base: [typography.sizes.base, { lineHeight: String(typography.lineHeights.body) }],
        md: typography.sizes.md,
        lg: typography.sizes.lg,
        xl: typography.sizes.xl,
        '2xl': typography.sizes['2xl'],
        '3xl': typography.sizes['3xl'],
        '4xl': typography.sizes['4xl'],
        '5xl': typography.sizes['5xl'],
      },
      fontWeight: typography.weights,
      lineHeight: typography.lineHeights,
      letterSpacing: typography.letterSpacing,
      borderRadius: radius,
      spacing,
      maxWidth: {
        container: layout.containerMax,
      },
      boxShadow: shadows,
      backgroundImage: {
        'gradient-brand': gradients.brand,
        'gradient-glow': gradients.glow,
      },
    },
  },
};
