import { ColorContrastChecker, WCAGColors } from '../../utils/colorContrast';

describe('ColorContrastChecker', () => {
  describe('getContrastRatio', () => {
    test('calculates correct contrast ratio for black and white', () => {
      const ratio = ColorContrastChecker.getContrastRatio('#000000', '#ffffff');
      expect(ratio).toBeCloseTo(21, 1);
    });

    test('calculates correct contrast ratio for same colors', () => {
      const ratio = ColorContrastChecker.getContrastRatio('#ffffff', '#ffffff');
      expect(ratio).toBe(1);
    });

    test('handles invalid hex colors', () => {
      const ratio = ColorContrastChecker.getContrastRatio('invalid', '#ffffff');
      expect(ratio).toBe(0);
    });
  });

  describe('WCAG compliance checks', () => {
    test('identifies WCAG AA compliant colors', () => {
      const isCompliant = ColorContrastChecker.meetsWCAG_AA('#000000', '#ffffff');
      expect(isCompliant).toBe(true);
    });

    test('identifies non-compliant colors', () => {
      const isCompliant = ColorContrastChecker.meetsWCAG_AA('#888888', '#999999');
      expect(isCompliant).toBe(false);
    });

    test('handles large text differently', () => {
      const normalText = ColorContrastChecker.meetsWCAG_AA('#767676', '#ffffff', false);
      const largeText = ColorContrastChecker.meetsWCAG_AA('#767676', '#ffffff', true);
      
      expect(normalText).toBe(false);
      expect(largeText).toBe(true);
    });
  });

  describe('getAccessibilityLevel', () => {
    test('returns correct accessibility level', () => {
      expect(ColorContrastChecker.getAccessibilityLevel('#000000', '#ffffff')).toBe('AAA');
      expect(ColorContrastChecker.getAccessibilityLevel('#767676', '#ffffff')).toBe('AA');
      expect(ColorContrastChecker.getAccessibilityLevel('#cccccc', '#ffffff')).toBe('Fail');
    });
  });

  describe('suggestImprovedColors', () => {
    test('returns original colors if already compliant', () => {
      const result = ColorContrastChecker.suggestImprovedColors('#000000', '#ffffff');
      expect(result.foreground).toBe('#000000');
      expect(result.background).toBe('#ffffff');
      expect(result.ratio).toBeCloseTo(21, 1);
    });

    test('suggests improvements for non-compliant colors', () => {
      const result = ColorContrastChecker.suggestImprovedColors('#cccccc', '#dddddd');
      expect(result.ratio).toBeGreaterThanOrEqual(4.5);
    });
  });
});

describe('WCAGColors', () => {
  test('high contrast colors meet AAA standards', () => {
    Object.values(WCAGColors.highContrast).forEach(colorPair => {
      const ratio = ColorContrastChecker.getContrastRatio(colorPair.fg, colorPair.bg);
      expect(ratio).toBeGreaterThanOrEqual(7);
    });
  });

  test('medium contrast colors meet AA standards', () => {
    Object.values(WCAGColors.mediumContrast).forEach(colorPair => {
      const ratio = ColorContrastChecker.getContrastRatio(colorPair.fg, colorPair.bg);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  test('status colors meet AA standards', () => {
    Object.values(WCAGColors.status).forEach(colorPair => {
      const ratio = ColorContrastChecker.getContrastRatio(colorPair.fg, colorPair.bg);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });
});
