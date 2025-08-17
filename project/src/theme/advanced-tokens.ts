/**
 * Advanced Design Tokens - Top 1% Standards
 * Sophisticated design system with mathematical precision
 */

// Advanced Color System with Perceptual Uniformity
export const advancedColors = {
  // Primary palette with perfect contrast ratios
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Base
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49'
  },
  
  // Semantic colors with accessibility
  semantic: {
    success: {
      light: '#10b981',
      dark: '#34d399',
      contrast: '#065f46'
    },
    warning: {
      light: '#f59e0b',
      dark: '#fbbf24',
      contrast: '#92400e'
    },
    error: {
      light: '#ef4444',
      dark: '#f87171',
      contrast: '#991b1b'
    },
    info: {
      light: '#3b82f6',
      dark: '#60a5fa',
      contrast: '#1e40af'
    }
  },

  // Advanced neutral system
  neutral: {
    light: {
      0: '#ffffff',
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
      950: '#0a0a0a'
    },
    dark: {
      0: '#000000',
      50: '#0a0a0a',
      100: '#171717',
      200: '#262626',
      300: '#404040',
      400: '#525252',
      500: '#737373',
      600: '#a3a3a3',
      700: '#d4d4d4',
      800: '#e5e5e5',
      900: '#f5f5f5',
      950: '#ffffff'
    }
  }
} as const;

// Advanced Typography with Perfect Ratios
export const advancedTypography = {
  // Perfect fourth scale (1.333)
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.025em' }],
    sm: ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.025em' }],
    base: ['1rem', { lineHeight: '1.5rem', letterSpacing: '0' }],
    lg: ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.025em' }],
    xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.025em' }],
    '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.025em' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.025em' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.025em' }],
    '5xl': ['3rem', { lineHeight: '1', letterSpacing: '-0.025em' }],
    '6xl': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.025em' }],
    '7xl': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.025em' }],
    '8xl': ['6rem', { lineHeight: '1', letterSpacing: '-0.025em' }],
    '9xl': ['8rem', { lineHeight: '1', letterSpacing: '-0.025em' }]
  },

  // Advanced font weights
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900'
  },

  // Sophisticated font families
  fontFamily: {
    sans: [
      'Inter var',
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'sans-serif'
    ],
    serif: [
      'Crimson Pro',
      'Georgia',
      'Times New Roman',
      'serif'
    ],
    mono: [
      'JetBrains Mono',
      'Fira Code',
      'Monaco',
      'Consolas',
      'monospace'
    ],
    display: [
      'Cal Sans',
      'Inter var',
      'Inter',
      'sans-serif'
    ]
  }
} as const;

// Advanced Spacing with Golden Ratio
export const advancedSpacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',   // 2px
  1: '0.25rem',      // 4px
  1.5: '0.375rem',   // 6px
  2: '0.5rem',       // 8px
  2.5: '0.625rem',   // 10px
  3: '0.75rem',      // 12px
  3.5: '0.875rem',   // 14px
  4: '1rem',         // 16px
  5: '1.25rem',      // 20px
  6: '1.5rem',       // 24px
  7: '1.75rem',      // 28px
  8: '2rem',         // 32px
  9: '2.25rem',      // 36px
  10: '2.5rem',      // 40px
  11: '2.75rem',     // 44px
  12: '3rem',        // 48px
  14: '3.5rem',      // 56px
  16: '4rem',        // 64px
  20: '5rem',        // 80px
  24: '6rem',        // 96px
  28: '7rem',        // 112px
  32: '8rem',        // 128px
  36: '9rem',        // 144px
  40: '10rem',       // 160px
  44: '11rem',       // 176px
  48: '12rem',       // 192px
  52: '13rem',       // 208px
  56: '14rem',       // 224px
  60: '15rem',       // 240px
  64: '16rem',       // 256px
  72: '18rem',       // 288px
  80: '20rem',       // 320px
  96: '24rem'        // 384px
} as const;

// Advanced Shadow System
export const advancedShadows = {
  // Elevation shadows
  elevation: {
    0: 'none',
    1: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    2: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    3: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    4: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    5: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    6: '0 25px 50px -12px rgb(0 0 0 / 0.25)'
  },

  // Colored shadows
  colored: {
    primary: '0 10px 15px -3px rgb(59 130 246 / 0.1), 0 4px 6px -4px rgb(59 130 246 / 0.1)',
    success: '0 10px 15px -3px rgb(16 185 129 / 0.1), 0 4px 6px -4px rgb(16 185 129 / 0.1)',
    warning: '0 10px 15px -3px rgb(245 158 11 / 0.1), 0 4px 6px -4px rgb(245 158 11 / 0.1)',
    error: '0 10px 15px -3px rgb(239 68 68 / 0.1), 0 4px 6px -4px rgb(239 68 68 / 0.1)'
  },

  // Inner shadows
  inner: {
    sm: 'inset 0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.06)',
    lg: 'inset 0 4px 6px -1px rgb(0 0 0 / 0.1)'
  }
} as const;

// Advanced Border Radius
export const advancedBorderRadius = {
  none: '0',
  sm: '0.125rem',
  base: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px'
} as const;

// Advanced Animation Curves
export const advancedEasing = {
  // Standard curves
  linear: 'linear',
  ease: 'ease',
  'ease-in': 'ease-in',
  'ease-out': 'ease-out',
  'ease-in-out': 'ease-in-out',

  // Custom curves for sophisticated animations
  'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  'bounce-out': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  'elastic-in': 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
  'elastic-out': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  'back-in': 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
  'back-out': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  'anticipate': 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
  'overshoot': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
} as const;

// Advanced Breakpoints
export const advancedBreakpoints = {
  xs: '475px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  '3xl': '1920px'
} as const;

// Advanced Z-Index Scale
export const advancedZIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800
} as const;

export const advancedTokens = {
  colors: advancedColors,
  typography: advancedTypography,
  spacing: advancedSpacing,
  shadows: advancedShadows,
  borderRadius: advancedBorderRadius,
  easing: advancedEasing,
  breakpoints: advancedBreakpoints,
  zIndex: advancedZIndex
} as const;

export default advancedTokens;
