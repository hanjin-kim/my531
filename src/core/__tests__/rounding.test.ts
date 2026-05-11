import { describe, it, expect } from 'vitest';
import { roundToIncrement, convertUnit } from '../rounding';

describe('roundToIncrement', () => {
  it('rounds to 2.5kg', () => {
    expect(roundToIncrement(55.25, 2.5)).toBe(55);
    expect(roundToIncrement(56.25, 2.5)).toBe(57.5);
    expect(roundToIncrement(63.75, 2.5)).toBe(65);
  });

  it('rounds to 5lbs', () => {
    expect(roundToIncrement(132, 5)).toBe(130);
    expect(roundToIncrement(133, 5)).toBe(135);
  });

  it('exact values stay the same', () => {
    expect(roundToIncrement(50, 2.5)).toBe(50);
    expect(roundToIncrement(100, 5)).toBe(100);
  });

  it('rounds to 1.25kg', () => {
    expect(roundToIncrement(51.3, 1.25)).toBe(51.25);
  });
});

describe('convertUnit', () => {
  it('returns same value for same unit', () => {
    expect(convertUnit(100, 'kg', 'kg')).toBe(100);
    expect(convertUnit(225, 'lbs', 'lbs')).toBe(225);
  });

  it('converts kg to lbs', () => {
    expect(convertUnit(100, 'kg', 'lbs')).toBeCloseTo(220.462, 1);
  });

  it('converts lbs to kg', () => {
    expect(convertUnit(225, 'lbs', 'kg')).toBeCloseTo(102.06, 1);
  });
});
