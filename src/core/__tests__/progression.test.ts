import { describe, it, expect } from 'vitest';
import { calculateTMIncrease, applyTMIncrease, reduceTM, buildTMReviews } from '../progression';
import type { AMRAPRecord, MainLift } from '../types';

const lift = (name: MainLift['name'], trainingMax: number): MainLift => ({
  name, trainingMax, oneRepMax: trainingMax / 0.9, unit: 'kg',
  mainSetStyle: '531', supplementType: 'bbb', updatedAt: '',
});

const amrap = (liftName: AMRAPRecord['liftName'], week: AMRAPRecord['week'], targetReps: number, actualReps: number, e1rm: number): AMRAPRecord => ({
  programId: 1, cycleId: 1, liftName, week, weight: 100, targetReps, actualReps, e1rm, date: '',
});

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

describe('buildTMReviews', () => {
  it('builds a review for every lift with increase/reduce candidates', () => {
    const reviews = buildTMReviews(
      [lift('bench', 85), lift('squat', 120)],
      [amrap('bench', 1, 5, 8, 110)],
      'kg',
    );

    expect(reviews).toHaveLength(2);

    const bench = reviews.find(r => r.liftName === 'bench')!;
    expect(bench.currentTM).toBe(85);
    expect(bench.increaseTM).toBe(87.5);
    expect(bench.reducedTM).toBe(76.5);
    expect(bench.bestE1rm).toBe(110);
    expect(bench.missedMin).toBe(false);
    expect(bench.amraps).toEqual([{ week: 1, targetReps: 5, actualReps: 8 }]);

    // A lift with no AMRAP records this cycle still gets a review.
    const squat = reviews.find(r => r.liftName === 'squat')!;
    expect(squat.increaseTM).toBe(125);
    expect(squat.amraps).toEqual([]);
    expect(squat.bestE1rm).toBe(0);
    expect(squat.missedMin).toBe(false);
  });

  it('flags missedMin when any AMRAP set is below its target reps', () => {
    const bench = buildTMReviews([lift('bench', 85)], [amrap('bench', 1, 5, 3, 95)], 'kg')[0]!;
    expect(bench.missedMin).toBe(true);
  });

  it('keeps the best e1RM across multiple AMRAP sets', () => {
    const bench = buildTMReviews(
      [lift('bench', 85)],
      [amrap('bench', 1, 5, 7, 108), amrap('bench', 2, 3, 5, 115), amrap('bench', 3, 1, 2, 112)],
      'kg',
    )[0]!;
    expect(bench.bestE1rm).toBe(115);
  });
});
