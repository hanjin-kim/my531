import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../schema';
import { regenerateActiveCycleSupplements } from '../supplement.repo';
import { BBB_SETS } from '../../../core/constants';
import type { Cycle, LiftName, Program, Settings, WorkoutDay, WorkoutSet, WorkoutStatus } from '../../../core/types';

const TM: Record<LiftName, number> = { squat: 100, bench: 80, deadlift: 120, ohp: 60 };

async function seed(cycleSupplement: Settings['defaultSupplement']) {
  await Promise.all([
    db.settings.clear(), db.programs.clear(), db.cycles.clear(),
    db.workoutDays.clear(), db.workoutSets.clear(),
  ]);

  await db.settings.add({
    id: 1, unit: 'kg', tmPercentage: 90, roundingIncrement: 2.5,
    leaderCycles: 2, anchorCycles: 1, defaultSupplement: cycleSupplement, skipDeload: false,
    tmIncrease: { squat: 5, bench: 2.5, deadlift: 5, ohp: 2.5 },
    createdAt: '', updatedAt: '',
  } as Settings);

  const programId = await db.programs.add({
    status: 'active', leaderCycles: 2, anchorCycles: 1, currentCycleIndex: 0, totalCycles: 3, createdAt: '',
  } as Program);

  const cycleId = await db.cycles.add({
    programId: programId as number, cycleIndex: 0, cycleType: 'leader',
    supplementType: cycleSupplement, status: 'active', tmSnapshots: TM,
  } as Cycle);

  return { programId: programId as number, cycleId: cycleId as number };
}

// A day always has a warmup + main set; supplementCount extra supplement sets appended.
async function addDay(cycleId: number, programId: number, week: number, status: WorkoutStatus, supplementCount = 0) {
  const dayId = await db.workoutDays.add({
    cycleId, programId, week, dayIndex: 0, liftName: 'bench', status,
  } as WorkoutDay);

  const sets: Omit<WorkoutSet, 'id'>[] = [
    { workoutDayId: dayId as number, setIndex: 0, setType: 'warmup', targetWeight: 40, targetReps: 5, isCompleted: false, isAmrap: false },
    { workoutDayId: dayId as number, setIndex: 1, setType: 'main', targetWeight: 68, targetReps: 5, isCompleted: false, isAmrap: false },
  ];
  for (let i = 0; i < supplementCount; i++) {
    sets.push({ workoutDayId: dayId as number, setIndex: 2 + i, setType: 'supplement', targetWeight: 40, targetReps: 10, isCompleted: false, isAmrap: false });
  }
  await db.workoutSets.bulkAdd(sets as WorkoutSet[]);
  return dayId as number;
}

const supplementSets = (dayId: number) =>
  db.workoutSets.where('workoutDayId').equals(dayId).filter(s => s.setType === 'supplement').toArray();

describe('regenerateActiveCycleSupplements', () => {
  beforeEach(async () => {
    await Promise.all([
      db.settings.clear(), db.programs.clear(), db.cycles.clear(),
      db.workoutDays.clear(), db.workoutSets.clear(),
    ]);
  });

  it('adds supplement sets to not-completed days and leaves completed days untouched', async () => {
    const { programId, cycleId } = await seed('none');
    const week1 = await addDay(cycleId, programId, 1, 'completed');
    const week2 = await addDay(cycleId, programId, 2, 'pending');

    await regenerateActiveCycleSupplements('bbb');

    expect(await supplementSets(week2)).toHaveLength(BBB_SETS);
    expect(await supplementSets(week1)).toHaveLength(0);

    // New supplement sets are appended after the existing warmup+main sets.
    const week2Supp = await supplementSets(week2);
    expect(Math.min(...week2Supp.map(s => s.setIndex))).toBe(2);

    const cycle = await db.cycles.get(cycleId);
    expect(cycle?.supplementType).toBe('bbb');
  });

  it('regenerates in_progress days too', async () => {
    const { programId, cycleId } = await seed('none');
    const week2 = await addDay(cycleId, programId, 2, 'in_progress');

    await regenerateActiveCycleSupplements('bbb');

    expect(await supplementSets(week2)).toHaveLength(BBB_SETS);
  });

  it('removes supplement sets when switching to none', async () => {
    const { programId, cycleId } = await seed('bbb');
    const week2 = await addDay(cycleId, programId, 2, 'pending', BBB_SETS);

    await regenerateActiveCycleSupplements('none');

    expect(await supplementSets(week2)).toHaveLength(0);
    expect((await db.cycles.get(cycleId))?.supplementType).toBe('none');
  });

  it('never adds supplement sets to the deload week (week 4)', async () => {
    const { programId, cycleId } = await seed('none');
    const week4 = await addDay(cycleId, programId, 4, 'pending');

    await regenerateActiveCycleSupplements('bbb');

    expect(await supplementSets(week4)).toHaveLength(0);
  });
});
