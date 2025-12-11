// Theme colors for TradeX
// Primary green: #10B95F

export const colors = {
  // Primary
  primary: '#10B95F',
  primaryLight: '#34D399',
  primaryDark: '#059669',
  
  // Backgrounds
  black: '#0A0A0A',
  darkBg: '#0A0A0A',
  darkCard: '#1F1F23',
  darkBorder: '#27272A',
  
  white: '#FFFFFF',
  lightBg: '#FAFAFA',
  lightCard: '#F4F4F5',
  lightBorder: '#E4E4E7',
  
  // Text
  textLight: '#F4F4F5',
  textDark: '#18181B',
  textMuted: '#71717A',
  textMutedLight: '#A1A1AA',
  
  // Status
  profit: '#10B95F',
  loss: '#EF4444',
  warning: '#FBBF24',
  info: '#6366F1',
  
  // Transparent variants
  primaryAlpha: 'rgba(16, 185, 95, 0.1)',
  profitAlpha: 'rgba(16, 185, 95, 0.1)',
  lossAlpha: 'rgba(239, 68, 68, 0.1)',
} as const;

// Dark theme colors
export const darkTheme = {
  bg: colors.darkBg,
  card: colors.darkCard,
  border: colors.darkBorder,
  text: colors.textLight,
  textMuted: colors.textMuted,
  primary: colors.primary,
};

// Light theme colors  
export const lightTheme = {
  bg: colors.lightBg,
  card: colors.lightCard,
  border: colors.lightBorder,
  text: colors.textDark,
  textMuted: colors.textMutedLight,
  primary: colors.primary,
};

export type ThemeColors = typeof darkTheme;
