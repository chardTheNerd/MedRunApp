import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import {
  darkPalette,
  lightPalette,
  type AppPalette,
  type ThemeMode,
} from '../../core/theme/colors';

type ThemeContextValue = {
  mode: Exclude<ThemeMode, 'system'>;
  effective: 'light' | 'dark';
  palette: AppPalette;
  toggle: () => void;
  setMode: (mode: Exclude<ThemeMode, 'system'>) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * App theme provider: blue primary, warm accent, with a manual light/dark
 * toggle. Defaults to the OS color scheme on first render.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<Exclude<ThemeMode, 'system'>>(
    system === 'dark' ? 'dark' : 'light',
  );

  const setMode = useCallback((next: Exclude<ThemeMode, 'system'>) => {
    setModeState(next);
  }, []);

  const toggle = useCallback(() => {
    setModeState((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const palette = mode === 'dark' ? darkPalette : lightPalette;
    return { mode, effective: mode, palette, toggle, setMode };
  }, [mode, toggle, setMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useTheme must be used inside ThemeProvider.');
  }
  return value;
}

/** Back-compat: static light palette for non-component code (headers, etc). */
export { lightPalette };
