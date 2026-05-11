import { describe, it, expect } from 'vitest';
import { generateTMTestSets, evaluateTMTest, generateSeventhWeekDeload } from '../seventh-week';

describe('generateTMTestSets', () => {
  it('generates 4 sets building up to TM', () => {
    const sets = generateTMTestSets(100, 2.5);
    expect(sets).toHaveLength(4);
    expect(sets[0]!.percentage).toBe(70);
    expect(sets[1]!.percentage).toBe(80);
    expect(sets[2]!.percentage).toBe(90);
    expect(sets[3]!.percentage).toBe(100);
  });

  it('marks the last set as AMRAP', () => {
    const sets = generateTMTestSets(100, 2.5);
    expect(sets[3]!.isAmrap).toBe(true);
    expect(sets[0]!.isAmrap).toBe(false);
  });

  it('rounds weights correctly', () => {
    const sets = generateTMTestSets(85, 2.5);
    expect(sets[0]!.weight).toBe(60);   // 85*0.70 = 59.5 -> 60
    expect(sets[1]!.weight).toBe(67.5); // 85*0.80 = 68 -> 67.5
    expect(sets[2]!.weight).toBe(77.5); // 85*0.90 = 76.5 -> 77.5
    expect(sets[3]!.weight).toBe(85);   // 85*1.00 = 85
  });
});

describe('evaluateTMTest', () => {
  it('returns pass for 5+ reps', () => {
    expect(evaluateTMTest(5)).toBe('pass');
    expect(evaluateTMTest(8)).toBe('pass');
  });

  it('returns marginal for 3-4 reps', () => {
    expect(evaluateTMTest(3)).toBe('marginal');
    expect(evaluateTMTest(4)).toBe('marginal');
  });

  it('returns fail for < 3 reps', () => {
    expect(evaluateTMTest(2)).toBe('fail');
    expect(evaluateTMTest(1)).toBe('fail');
    expect(evaluateTMTest(0)).toBe('fail');
  });
});

describe('generateSeventhWeekDeload', () => {
  it('generates deload sets (same as week 4)', () => {
    const sets = generateSeventhWeekDeload(100, 2.5);
    expect(sets).toHaveLength(3);
    expect(sets[0]!.percentage).toBe(40);
    expect(sets[1]!.percentage).toBe(50);
    expect(sets[2]!.percentage).toBe(60);
    expect(sets.every(s => !s.isAmrap)).toBe(true);
  });
});
