import { describe, it, expect } from 'vitest';
import { formatTime } from '../../utils/formatTime';

describe('formatTime', () => {
  it('formats seconds to MM:SS correctly', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(30)).toBe('0:30');
    expect(formatTime(60)).toBe('1:00');
    expect(formatTime(90)).toBe('1:30');
    expect(formatTime(180)).toBe('3:00');
    expect(formatTime(3661)).toBe('61:01'); // Over an hour
  });

  it('handles decimal seconds by rounding down', () => {
    expect(formatTime(30.9)).toBe('0:30');
    expect(formatTime(59.9)).toBe('0:59');
    expect(formatTime(60.9)).toBe('1:00');
  });

  it('handles negative values by returning 0:00', () => {
    expect(formatTime(-10)).toBe('0:00');
    expect(formatTime(-60)).toBe('0:00');
  });

  it('handles NaN by returning 0:00', () => {
    expect(formatTime(NaN)).toBe('0:00');
  });

  it('handles undefined by returning 0:00', () => {
    expect(formatTime(undefined as unknown as number)).toBe('0:00');
  });

  it('pads single-digit seconds with a leading zero', () => {
    expect(formatTime(1)).toBe('0:01');
    expect(formatTime(9)).toBe('0:09');
    expect(formatTime(61)).toBe('1:01');
    expect(formatTime(69)).toBe('1:09');
  });

  it('does not pad minutes with a leading zero', () => {
    expect(formatTime(60)).toBe('1:00');
    expect(formatTime(600)).toBe('10:00');
  });
});