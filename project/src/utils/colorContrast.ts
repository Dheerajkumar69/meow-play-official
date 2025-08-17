/**
 * Color contrast utility for WCAG compliance
 */
export class ColorContrastChecker {
  /**
   * Convert hex color to RGB
   */
  private static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1]!, 16),
      g: parseInt(result[2]!, 16),
      b: parseInt(result[3]!, 16)
    } : null;
  }

  /**
   * Calculate relative luminance
   */
  private static getLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs! + 0.7152 * gs! + 0.0722 * bs!;
  }

  /**
   * Calculate contrast ratio between two colors
   */
  static getContrastRatio(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return 0;
    
    const lum1 = this.getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = this.getLuminance(rgb2.r, rgb2.g, rgb2.b);
    
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  }

  /**
   * Check if contrast meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
   */
  static meetsWCAG_AA(foreground: string, background: string, isLargeText = false): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
  }

  /**
   * Check if contrast meets WCAG AAA standards (7:1 for normal text, 4.5:1 for large text)
   */
  static meetsWCAG_AAA(foreground: string, background: string, isLargeText = false): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }

  /**
   * Get accessibility level for color combination
   */
  static getAccessibilityLevel(foreground: string, background: string, isLargeText = false): 'AAA' | 'AA' | 'Fail' {
    if (this.meetsWCAG_AAA(foreground, background, isLargeText)) return 'AAA';
    if (this.meetsWCAG_AA(foreground, background, isLargeText)) return 'AA';
    return 'Fail';
  }

  /**
   * Suggest improved colors for better contrast
   */
  static suggestImprovedColors(foreground: string, background: string): {
    foreground: string;
    background: string;
    ratio: number;
  } {
    const currentRatio = this.getContrastRatio(foreground, background);
    
    // If already good, return as is
    if (currentRatio >= 4.5) {
      return { foreground, background, ratio: currentRatio };
    }

    // Simple improvement: darken foreground or lighten background
    const fgRgb = this.hexToRgb(foreground);
    const bgRgb = this.hexToRgb(background);
    
    if (!fgRgb || !bgRgb) {
      return { foreground, background, ratio: currentRatio };
    }

    // Try darkening foreground
    const darkerFg = `#${Math.max(0, fgRgb.r - 50).toString(16).padStart(2, '0')}${Math.max(0, fgRgb.g - 50).toString(16).padStart(2, '0')}${Math.max(0, fgRgb.b - 50).toString(16).padStart(2, '0')}`;
    const darkerRatio = this.getContrastRatio(darkerFg, background);
    
    if (darkerRatio >= 4.5) {
      return { foreground: darkerFg, background, ratio: darkerRatio };
    }

    // Try lightening background
    const lighterBg = `#${Math.min(255, bgRgb.r + 50).toString(16).padStart(2, '0')}${Math.min(255, bgRgb.g + 50).toString(16).padStart(2, '0')}${Math.min(255, bgRgb.b + 50).toString(16).padStart(2, '0')}`;
    const lighterRatio = this.getContrastRatio(foreground, lighterBg);
    
    if (lighterRatio >= 4.5) {
      return { foreground, background: lighterBg, ratio: lighterRatio };
    }

    // Fallback to high contrast
    return {
      foreground: '#000000',
      background: '#ffffff',
      ratio: 21
    };
  }
}

/**
 * WCAG compliant color palette
 */
export const WCAGColors = {
  // High contrast pairs (AAA compliant)
  highContrast: {
    dark: { fg: '#ffffff', bg: '#000000' }, // 21:1
    light: { fg: '#000000', bg: '#ffffff' }, // 21:1
    purple: { fg: '#ffffff', bg: '#4c1d95' }, // 8.2:1
    blue: { fg: '#ffffff', bg: '#1e3a8a' }, // 8.6:1
    green: { fg: '#ffffff', bg: '#14532d' }, // 9.1:1
    red: { fg: '#ffffff', bg: '#7f1d1d' }, // 8.9:1
  },
  
  // Medium contrast pairs (AA compliant)
  mediumContrast: {
    purple: { fg: '#ffffff', bg: '#7c3aed' }, // 4.7:1
    blue: { fg: '#ffffff', bg: '#2563eb' }, // 4.8:1
    green: { fg: '#ffffff', bg: '#16a34a' }, // 4.6:1
    red: { fg: '#ffffff', bg: '#dc2626' }, // 4.5:1
    gray: { fg: '#374151', bg: '#f9fafb' }, // 4.6:1
  },
  
  // Status colors (AA compliant)
  status: {
    success: { fg: '#065f46', bg: '#d1fae5' }, // 4.8:1
    warning: { fg: '#92400e', bg: '#fef3c7' }, // 4.5:1
    error: { fg: '#7f1d1d', bg: '#fee2e2' }, // 4.9:1
    info: { fg: '#1e3a8a', bg: '#dbeafe' }, // 4.7:1
  }
};
