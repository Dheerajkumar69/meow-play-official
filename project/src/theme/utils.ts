/**
 * Theme Utility Functions
 * Helper functions for working with themes and design tokens
 */

import { designTokens, Theme } from './tokens';

// Color utility functions
export const getColorValue = (colorPath: string, theme?: Theme): string => {
  const parts = colorPath.split('.');
  let value: any = theme?.colors || designTokens.colors;
  
  for (const part of parts) {
    value = value?.[part];
  }
  
  return typeof value === 'string' ? value : colorPath;
};

// Responsive utility functions
export const getBreakpointValue = (breakpoint: keyof typeof designTokens.breakpoints): string => {
  return designTokens.breakpoints[breakpoint];
};

// Spacing utility functions
export const getSpacingValue = (spacing: keyof typeof designTokens.spacing): string => {
  return designTokens.spacing[spacing];
};

// Typography utility functions
export const getTypography = (size: keyof typeof designTokens.typography.fontSize) => {
  return designTokens.typography.fontSize[size];
};

// Shadow utility functions
export const getShadowValue = (shadow: keyof typeof designTokens.boxShadow): string => {
  return designTokens.boxShadow[shadow];
};

// Border radius utility functions
export const getBorderRadiusValue = (radius: keyof typeof designTokens.borderRadius): string => {
  return designTokens.borderRadius[radius];
};

// Theme-aware class name generator
export const createThemeClasses = (isDark: boolean) => ({
  // Background classes
  bg: {
    primary: isDark ? 'bg-neutral-950' : 'bg-neutral-50',
    secondary: isDark ? 'bg-neutral-900' : 'bg-neutral-100',
    tertiary: isDark ? 'bg-neutral-800' : 'bg-neutral-200',
    elevated: isDark ? 'bg-neutral-900' : 'bg-white',
    overlay: isDark ? 'bg-black/80' : 'bg-black/50'
  },
  
  // Text classes
  text: {
    primary: isDark ? 'text-neutral-50' : 'text-neutral-900',
    secondary: isDark ? 'text-neutral-300' : 'text-neutral-700',
    tertiary: isDark ? 'text-neutral-500' : 'text-neutral-500',
    inverse: isDark ? 'text-neutral-900' : 'text-white',
    disabled: isDark ? 'text-neutral-600' : 'text-neutral-400'
  },
  
  // Border classes
  border: {
    primary: isDark ? 'border-neutral-800' : 'border-neutral-200',
    secondary: isDark ? 'border-neutral-700' : 'border-neutral-300',
    focus: isDark ? 'border-purple-400' : 'border-purple-500'
  },
  
  // Brand classes
  brand: {
    primary: isDark ? 'text-purple-500' : 'text-purple-600',
    secondary: isDark ? 'text-blue-500' : 'text-blue-600',
    accent: isDark ? 'text-purple-400' : 'text-purple-500'
  }
});

// Animation and transition utilities
export const transitions = {
  default: 'transition-all duration-200 ease-out',
  fast: 'transition-all duration-150 ease-out',
  slow: 'transition-all duration-300 ease-out',
  colors: 'transition-colors duration-200 ease-out',
  transform: 'transition-transform duration-200 ease-out',
  opacity: 'transition-opacity duration-200 ease-out'
};

// Focus ring utilities
export const focusRing = {
  default: 'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2',
  inset: 'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-inset',
  none: 'focus:outline-none'
};

// Hover effects
export const hoverEffects = {
  scale: 'hover:scale-105 transition-transform duration-200',
  lift: 'hover:shadow-lg hover:-translate-y-1 transition-all duration-200',
  glow: 'hover:shadow-purple-500/25 hover:shadow-lg transition-shadow duration-200',
  brightness: 'hover:brightness-110 transition-all duration-200'
};

// Glass morphism effects
export const glassMorphism = {
  light: 'bg-white/80 backdrop-blur-lg border border-white/20',
  dark: 'bg-black/20 backdrop-blur-lg border border-white/10',
  colored: 'bg-purple-500/10 backdrop-blur-lg border border-purple-500/20'
};

// Gradient utilities
export const gradients = {
  primary: 'bg-gradient-to-r from-purple-600 to-blue-600',
  secondary: 'bg-gradient-to-r from-blue-600 to-cyan-600',
  success: 'bg-gradient-to-r from-green-500 to-emerald-500',
  warning: 'bg-gradient-to-r from-yellow-500 to-orange-500',
  error: 'bg-gradient-to-r from-red-500 to-pink-500',
  neutral: 'bg-gradient-to-r from-gray-500 to-gray-600',
  rainbow: 'bg-gradient-to-r from-purple-500 via-pink-500 to-red-500'
};

// Component size variants
export const sizeVariants = {
  xs: {
    padding: 'px-2 py-1',
    text: 'text-xs',
    height: 'h-6',
    minWidth: 'min-w-[1.5rem]'
  },
  sm: {
    padding: 'px-3 py-1.5',
    text: 'text-sm',
    height: 'h-8',
    minWidth: 'min-w-[2rem]'
  },
  md: {
    padding: 'px-4 py-2',
    text: 'text-sm',
    height: 'h-10',
    minWidth: 'min-w-[2.5rem]'
  },
  lg: {
    padding: 'px-6 py-3',
    text: 'text-base',
    height: 'h-12',
    minWidth: 'min-w-[3rem]'
  },
  xl: {
    padding: 'px-8 py-4',
    text: 'text-lg',
    height: 'h-14',
    minWidth: 'min-w-[3.5rem]'
  }
};

// Accessibility utilities
export const a11y = {
  srOnly: 'sr-only',
  notSrOnly: 'not-sr-only',
  focusVisible: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500',
  reducedMotion: 'motion-reduce:transition-none motion-reduce:transform-none'
};

// Layout utilities
export const layout = {
  container: 'mx-auto px-4 sm:px-6 lg:px-8',
  section: 'py-12 sm:py-16 lg:py-20',
  grid: {
    responsive: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
    auto: 'grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6'
  },
  flex: {
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    start: 'flex items-center justify-start',
    end: 'flex items-center justify-end'
  }
};

export default {
  getColorValue,
  getBreakpointValue,
  getSpacingValue,
  getTypography,
  getShadowValue,
  getBorderRadiusValue,
  createThemeClasses,
  transitions,
  focusRing,
  hoverEffects,
  glassMorphism,
  gradients,
  sizeVariants,
  a11y,
  layout
};
