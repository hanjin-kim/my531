import { describe, it, expect } from 'vitest';
import { calculateTMIncrease, applyTMIncrease, reduceTM } from '../progression';

describe('calculateTMIncrease', () => {
  it('returns 2.5kg for upper body lifts in kg', () => {
    expect(calculateTMIncrease('bench', 'kg')).toBe(2.5);
    expect(calculateTMIncrease('ohp', 'kg')).toBe(2.5);
  });

  it('returns 5kg for lower body lifts in kg', () => {
    expect(calculateTMIncrease('squat', 'kg')).toBe(5);
    expect(calculateTMIncrease('deadlift', 'kg')).toBe(5);
  });

  it('returns 5lbs for upper body lifts in lbs', () => {
    expect(calculateTMIncrease('bench', 'lbs')).toBe(5);
    expect(calculateTMIncrease('ohp', 'lbs')).toBe(5);
  });

  it('returns 10lbs for lower body lifts in lbs', () => {
    expect(calculateTMIncrease('squat', 'lbs')).toBe(10);
    expect(calculateTMIncrease('deadlift', 'lbs')).toBe(10);
  });
});

describe('applyTMIncrease', () => {
  it('adds correct increment', () => {
    expect(applyTMIncrease(85, 'bench', 'kg')).toBe(87.5);
    expect(applyTMIncrease(120, 'squat', 'kg')).toBe(125);
    expect(applyTMIncrease(185, 'bench', 'lbs')).toBe(190);
    expect(applyTMIncrease(315, 'deadlift', 'lbs')).toBe(325);
  });
});

describe('reduceTM', () => {
  it('reduces by 10% by default', () => {
    expect(reduceTM(100)).toBe(90);
  });

  it('reduces by custom percentage', () => {
    expect(reduceTM(100, 15)).toBe(85);
  });
});
