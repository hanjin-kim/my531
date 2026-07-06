import { describe, it, expect } from 'vitest';
import { calculate1RM, calculateTM, calculateWorkingWeight, estimateE1RM, generateMainSets, generateSupplementSets } from '../calculator';

describe('calculate1RM', () => {
  it('returns weight when reps is 1', () => {
    expect(calculate1RM(100, 1)).toBe(100);
  });

  it('returns weight when reps is 0', () => {
    expect(calculate1RM(100, 0)).toBe(100);
  });

  it('calculates using Epley formula', () => {
    // 100 * (1 + 5/30) = 100 * 1.1667 = 116.67
    expect(calculate1RM(100, 5)).toBeCloseTo(116.67, 1);
  });

  it('calculates for 10 reps', () => {
    // 100 * (1 + 10/30) = 100 * 1.3333 = 133.33
    expect(calculate1RM(100, 10)).toBeCloseTo(133.33, 1);
  });
});

describe('calculateTM', () => {
  it('calculates TM at 85%', () => {
    expect(calculateTM(100, 85)).toBeCloseTo(85, 1);
  });

  it('calculates TM at 90%', () => {
    expect(calculateTM(200, 90)).toBeCloseTo(180, 1);
  });
});

describe('calculateWorkingWeight', () => {
  it('rounds to 2.5kg increment', () => {
    // TM=85, 65% = 55.25 -> round to 55.0
    expect(calculateWorkingWeight(85, 65, 2.5)).toBe(55);
  });

  it('rounds to 5lbs increment', () => {
    // TM=185, 70% = 129.5 -> round to 130
    expect(calculateWorkingWeight(185, 70, 5)).toBe(130);
  });
});

describe('estimateE1RM', () => {
  it('is the same as calculate1RM', () => {
    expect(estimateE1RM(100, 5)).toBe(calculate1RM(100, 5));
  });
});

describe('generateMainSets', () => {
  const tm = 100;
  const rounding = 2.5;

  it('generates week 1 sets (5/5/5+)', () => {
    const sets = generateMainSets(tm, 1, rounding);
    expect(sets).toHaveLength(3);
    expect(sets[0]).toEqual({ percentage: 65, weight: 65, targetReps: 5, isAmrap: false });
    expect(sets[1]).toEqual({ percentage: 75, weight: 75, targetReps: 5, isAmrap: false });
    expect(sets[2]).toEqual({ percentage: 85, weight: 85, targetReps: 5, isAmrap: true });
  });

  it('generates week 2 sets (3/3/3+)', () => {
    const sets = generateMainSets(tm, 2, rounding);
    expect(sets).toHaveLength(3);
    expect(sets[0]).toEqual({ percentage: 70, weight: 70, targetReps: 3, isAmrap: false });
    expect(sets[1]).toEqual({ percentage: 80, weight: 80, targetReps: 3, isAmrap: false });
    expect(sets[2]).toEqual({ percentage: 90, weight: 90, targetReps: 3, isAmrap: true });
  });

  it('generates week 3 sets (5/3/1+)', () => {
    const sets = generateMainSets(tm, 3, rounding);
    expect(sets).toHaveLength(3);
    expect(sets[0]).toEqual({ percentage: 75, weight: 75, targetReps: 5, isAmrap: false });
    expect(sets[1]).toEqual({ percentage: 85, weight: 85, targetReps: 3, isAmrap: false });
    expect(sets[2]).toEqual({ percentage: 95, weight: 95, targetReps: 1, isAmrap: true });
  });

  it('generates week 4 deload sets (no AMRAP)', () => {
    const sets = generateMainSets(tm, 4, rounding);
    expect(sets).toHaveLength(3);
    expect(sets[0]).toEqual({ percentage: 40, weight: 40, targetReps: 5, isAmrap: false });
    expect(sets[1]).toEqual({ percentage: 50, weight: 50, targetReps: 5, isAmrap: false });
    expect(sets[2]).toEqual({ percentage: 60, weight: 60, targetReps: 5, isAmrap: false });
  });

  it('generates 5s PRO sets (5 reps, no AMRAP) at the same percentages', () => {
    const sets = generateMainSets(tm, 3, rounding, true);
    expect(sets).toHaveLength(3);
    expect(sets[0]).toEqual({ percentage: 75, weight: 75, targetReps: 5, isAmrap: false });
    expect(sets[1]).toEqual({ percentage: 85, weight: 85, targetReps: 5, isAmrap: false });
    expect(sets[2]).toEqual({ percentage: 95, weight: 95, targetReps: 5, isAmrap: false });
  });

  it('applies rounding correctly', () => {
    const sets = generateMainSets(85, 1, 2.5);
    // 85 * 0.65 = 55.25 -> 55
    expect(sets[0]!.weight).toBe(55);
    // 85 * 0.75 = 63.75 -> 63.75 rounds to 65
    expect(sets[1]!.weight).toBe(63.75 % 2.5 === 0 ? 63.75 : Math.round(63.75 / 2.5) * 2.5);
  });
});

describe('generateSupplementSets', () => {
  const tm = 100;
  const rounding = 2.5;

  it('returns empty for none', () => {
    expect(generateSupplementSets(tm, 1, 'none', rounding)).toEqual([]);
  });

  it('generates BBB sets (5x10 @ 50%)', () => {
    const sets = generateSupplementSets(tm, 1, 'bbb', rounding);
    expect(sets).toHaveLength(1);
    expect(sets[0]!.sets).toBe(5);
    expect(sets[0]!.targetReps).toBe(10);
    expect(sets[0]!.weight).toBe(50);
  });

  it('generates BBB with custom percentage', () => {
    const sets = generateSupplementSets(tm, 1, 'bbb', rounding, { bbbPercentage: 60 });
    expect(sets[0]!.weight).toBe(60);
  });

  it('generates FSL sets (5x5 @ first set weight)', () => {
    const sets = generateSupplementSets(tm, 1, 'fsl', rounding);
    expect(sets).toHaveLength(1);
    expect(sets[0]!.sets).toBe(5);
    expect(sets[0]!.targetReps).toBe(5);
    // Week 1 first set is 65% of TM
    expect(sets[0]!.weight).toBe(65);
  });

  it('FSL uses correct first set for each week', () => {
    const w2 = generateSupplementSets(tm, 2, 'fsl', rounding);
    expect(w2[0]!.weight).toBe(70); // Week 2 first set is 70%

    const w3 = generateSupplementSets(tm, 3, 'fsl', rounding);
    expect(w3[0]!.weight).toBe(75); // Week 3 first set is 75%
  });
});
