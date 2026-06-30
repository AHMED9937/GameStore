import { colors, gradients } from './tokens/colors';
import { radius } from './tokens/radius';
import { shadows } from './tokens/shadows';
import { spacing, layout } from './tokens/spacing';
import { typography } from './tokens/typography';

/** Tailwind preset — wire when Tailwind is added to apps/web */
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
        sans: [typography.fontBody],
        display: [typography.fontDisplay],
      },
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
