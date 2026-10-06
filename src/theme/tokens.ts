export const colors = {
  light: {
    bg: '#FAFAF8',
    surface: '#FFFFFF',
    surfaceAlt: '#F2F2EF',
    text: '#111111',
    textSecondary: '#6B6B68',
    textTertiary: '#A3A3A0',
    hairline: '#E6E6E2',
    accent: '#E5484D',
    ink: '#111111',
    inkText: '#FFFFFF',
    danger: '#D13438',
  },
  dark: {
    bg: '#0E0E0F',
    surface: '#161617',
    surfaceAlt: '#1E1E20',
    text: '#F2F2F0',
    textSecondary: '#9A9A97',
    textTertiary: '#5F5F5C',
    hairline: '#2A2A2C',
    accent: '#FF6369',
    ink: '#F2F2F0',
    inkText: '#0E0E0F',
    danger: '#FF6369',
  },
};

export type ThemeColors = typeof colors.light;

export type BlockCategory = 'work' | 'study' | 'health' | 'life' | 'other';

export const categoryColors: Record<
  BlockCategory,
  { solid: string; tintLight: string; tintDark: string }
> = {
  work: {
    solid: '#4C6E91',
    tintLight: 'rgba(76, 110, 145, 0.14)',
    tintDark: 'rgba(76, 110, 145, 0.22)',
  },
  study: {
    solid: '#6B8F71',
    tintLight: 'rgba(107, 143, 113, 0.14)',
    tintDark: 'rgba(107, 143, 113, 0.22)',
  },
  health: {
    solid: '#C27C5A',
    tintLight: 'rgba(194, 124, 90, 0.14)',
    tintDark: 'rgba(194, 124, 90, 0.22)',
  },
  life: {
    solid: '#B59A57',
    tintLight: 'rgba(181, 154, 87, 0.14)',
    tintDark: 'rgba(181, 154, 87, 0.22)',
  },
  other: {
    solid: '#8A8A87',
    tintLight: 'rgba(138, 138, 135, 0.14)',
    tintDark: 'rgba(138, 138, 135, 0.22)',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  screenPadding: 20,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  pill: 999,
} as const;

export const hitTargets = {
  min: 44,
  rowHeight: 54,
} as const;
