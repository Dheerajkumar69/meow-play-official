/**
 * Theme Context and Provider
 * Centralized theme management with dark/light mode support
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { lightTheme, darkTheme, Theme } from './tokens';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
  storageKey?: string;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultMode = 'system',
  storageKey = 'meow-play-theme'
}) => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey) as ThemeMode;
      return stored || defaultMode;
    }
    return defaultMode;
  });

  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Determine the actual theme to use
  const isDark = mode === 'dark' || (mode === 'system' && systemTheme === 'dark');
  const theme = isDark ? darkTheme : lightTheme;

  // Update localStorage when mode changes
  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, newMode);
    }
  };

  // Toggle between light and dark (not system)
  const toggleTheme = () => {
    setMode(isDark ? 'light' : 'dark');
  };

  // Apply theme to document root
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    // Add current theme class
    root.classList.add(isDark ? 'dark' : 'light');

    // Set CSS custom properties for theme colors
    const setProperty = (property: string, value: string) => {
      root.style.setProperty(property, value);
    };

    // Background colors
    setProperty('--color-bg-primary', theme.colors.background.primary);
    setProperty('--color-bg-secondary', theme.colors.background.secondary);
    setProperty('--color-bg-tertiary', theme.colors.background.tertiary);
    setProperty('--color-bg-elevated', theme.colors.background.elevated);
    setProperty('--color-bg-overlay', theme.colors.background.overlay);

    // Text colors
    setProperty('--color-text-primary', theme.colors.text.primary);
    setProperty('--color-text-secondary', theme.colors.text.secondary);
    setProperty('--color-text-tertiary', theme.colors.text.tertiary);
    setProperty('--color-text-inverse', theme.colors.text.inverse);
    setProperty('--color-text-disabled', theme.colors.text.disabled);

    // Border colors
    setProperty('--color-border-primary', theme.colors.border.primary);
    setProperty('--color-border-secondary', theme.colors.border.secondary);
    setProperty('--color-border-focus', theme.colors.border.focus);

    // Brand colors
    setProperty('--color-brand-primary', theme.colors.brand.primary);
    setProperty('--color-brand-secondary', theme.colors.brand.secondary);
    setProperty('--color-brand-accent', theme.colors.brand.accent);

  }, [theme, isDark]);

  const value: ThemeContextValue = {
    theme,
    mode,
    setMode,
    setTheme: setMode,
    toggleTheme,
    isDark
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Hook for getting theme-aware styles
export const useThemeStyles = () => {
  const { theme, isDark } = useTheme();
  
  return {
    theme,
    isDark,
    // Common style utilities
    bg: {
      primary: `bg-[${theme.colors.background.primary}]`,
      secondary: `bg-[${theme.colors.background.secondary}]`,
      tertiary: `bg-[${theme.colors.background.tertiary}]`,
      elevated: `bg-[${theme.colors.background.elevated}]`
    },
    text: {
      primary: `text-[${theme.colors.text.primary}]`,
      secondary: `text-[${theme.colors.text.secondary}]`,
      tertiary: `text-[${theme.colors.text.tertiary}]`,
      inverse: `text-[${theme.colors.text.inverse}]`
    },
    border: {
      primary: `border-[${theme.colors.border.primary}]`,
      secondary: `border-[${theme.colors.border.secondary}]`,
      focus: `border-[${theme.colors.border.focus}]`
    }
  };
};

export default ThemeProvider;
