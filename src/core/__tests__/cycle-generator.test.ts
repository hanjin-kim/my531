import { describe, it, expect } from 'vitest';
import { generateCycleWorkouts } from '../cycle-generator';
import type { LiftName } from '../types';

const tmSnapshots: Record<LiftName, number> = {
  squat: 120,
  bench: 80,
  deadlift: 140,
  ohp: 60,
};

describe('generateCycleWorkouts', () => {
  it('generates 16 workout days (4 weeks x 4 lifts)', () => {
    const { workoutDays } = generateCycleWorkouts(1, 1, tmSnapshots, 'none', 2.5);
    expect(workoutDays).toHaveLength(16);
  });

  it('each week has all 4 lifts', () => {
    const { workoutDays } = generateCycleWorkouts(1, 1, tmSnapshots, 'none', 2.5);
    for (const week of [1, 2, 3, 4] as const) {
      const weekDays = workoutDays.filter(d => d.week === week);
      expect(weekDays).toHaveLength(4);
      const lifts = weekDays.map(d => d.liftName).sort();
      expect(lifts).toEqual(['bench', 'deadlift', 'ohp', 'squat']);
    }
  });

  it('generates 3 main sets per workout day with no supplement', () => {
    const { workoutDays, workoutSets } = generateCycleWorkouts(1, 1, tmSnapshots, 'none', 2.5);
    for (let i = 0; i < workoutDays.length; i++) {
      const sets = workoutSets.filter(s => s.workoutDayId === i);
      expect(sets.length).toBe(3);
    }
  });

  it('generates 3 main + 5 supplement sets for BBB (weeks 1-3)', () => {
    const { workoutDays, workoutSets } = generateCycleWorkouts(1, 1, tmSnapshots, 'bbb', 2.5);
    for (let i = 0; i < workoutDays.length; i++) {
      const day = workoutDays[i]!;
      const sets = workoutSets.filter(s => s.workoutDayId === i);
      if (day.week === 4) {
        expect(sets.length).toBe(3); // deload: no supplement
      } else {
        expect(sets.length).toBe(8); // 3 main + 5 BBB
      }
    }
  });

  it('generates correct FSL weights (first set weight)', () => {
    const { workoutDays, workoutSets } = generateCycleWorkouts(1, 1, tmSnapshots, 'fsl', 2.5);
    // Week 1, squat: first set = 65% of 120 = 78 -> round to 77.5
    const week1SquatDay = workoutDays.findIndex(d => d.week === 1 && d.liftName === 'squat');
    const sets = workoutSets.filter(s => s.workoutDayId === week1SquatDay);
    const mainSets = sets.filter(s => s.setType === 'main' || s.setType === 'amrap');
    const suppSets = sets.filter(s => s.setType === 'supplement');

    expect(mainSets).toHaveLength(3);
    expect(suppSets).toHaveLength(5);
    expect(suppSets[0]!.targetWeight).toBe(mainSets[0]!.targetWeight);
  });

  it('sets all workouts to pending status', () => {
    const { workoutDays } = generateCycleWorkouts(1, 1, tmSnapshots, 'none', 2.5);
    expect(workoutDays.every(d => d.status === 'pending')).toBe(true);
  });

  it('marks last main set as AMRAP for weeks 1-3', () => {
    const { workoutDays, workoutSets } = generateCycleWorkouts(1, 1, tmSnapshots, 'none', 2.5);
    for (let i = 0; i < workoutDays.length; i++) {
      const day = workoutDays[i]!;
      const sets = workoutSets.filter(s => s.workoutDayId === i);
      const lastMainSet = sets[2]!;
      if (day.week === 4) {
        expect(lastMainSet.isAmrap).toBe(false);
      } else {
        expect(lastMainSet.isAmrap).toBe(true);
      }
    }
  });
});
