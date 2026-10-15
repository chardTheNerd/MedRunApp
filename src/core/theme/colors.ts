export type ThemeMode = 'light' | 'dark' | 'system';

export type AppPalette = {
  brand: string;
  brandDark: string;
  brandSoft: string;
  accent: string;
  accentDark: string;
  background: string;
  surface: string;
  card: string;
  ink: string;
  muted: string;
  danger: string;
  white: string;
  border: string;
};

export const lightPalette: AppPalette = {
  brand: '#1D6FDC',
  brandDark: '#1559B4',
  brandSoft: '#E3EEFC',
  accent: '#E8892B',
  accentDark: '#B85F12',
  background: '#F2F6FC',
  surface: '#E4EBF4',
  card: '#FFFFFF',
  ink: '#152238',
  muted: '#5B6B82',
  danger: '#C1121F',
  white: '#FFFFFF',
  border: '#D4DEEA',
};

export const darkPalette: AppPalette = {
  brand: '#5B9BF5',
  brandDark: '#8FBBF8',
  brandSoft: '#1B2E4A',
  accent: '#F0A04B',
  accentDark: '#F7BE7D',
  background: '#0C1626',
  surface: '#14233A',
  card: '#16263E',
  ink: '#EAF1FA',
  muted: '#9DB0C7',
  danger: '#F26D6D',
  white: '#FFFFFF',
  border: '#26394F',
};

/** Back-compat alias for code not yet behind ThemeProvider. */
export const colors = lightPalette;
