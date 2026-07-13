import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../schema';
import { regenerateActiveCycleForLift } from '../supplement.repo';
import { BBB_SETS } from '../../../core/constants';
import type { Cycle, LiftName, MainLift, MainSetStyle, Program, Settings, SupplementType, WorkoutDay, WorkoutSet, WorkoutStatus } from '../../../core/types';

const TM: Record<LiftName, number> = { squat: 100, bench: 80, deadlift: 120, ohp: 60 };

async function clearAll() {
  await Promise.all([
    db.settings.clear(), db.mainLifts.clear(), db.programs.clear(),
    db.cycles.clear(), db.workoutDays.clear(), db.workoutSets.clear(),
  ]);
}

async function seedProgramCycle() {
  await db.settings.add({
    id: 1, unit: 'kg', tmPercentage: 90, roundingIncrement: 2.5,
    leaderCycles: 2, anchorCycles: 1, defaultSupplement: 'bbb',
    bbbSets: 5, fslSets: 5, skipDeload: false,
    tmIncrease: { squat: 5, bench: 2.5, deadlift: 5, ohp: 2.5 },
    createdAt: '', updatedAt: '',
  } as Settings);

  const programId = await db.programs.add({
    status: 'active', leaderCycles: 2, anchorCycles: 1, currentCycleIndex: 0, totalCycles: 3, createdAt: '',
  } as Program);

  const cycleId = await db.cycles.add({
    programId: programId as number, cycleIndex: 0, cycleType: 'leader',
    status: 'active', tmSnapshots: TM,
  } as Cycle);

  return { programId: programId as number, cycleId: cycleId as number };
}

async function seedLift(name: LiftName, mainSetStyle: MainSetStyle, supplementType: SupplementType) {
  await db.mainLifts.add({
    name, oneRepMax: TM[name] / 0.9, trainingMax: TM[name], unit: 'kg',
    mainSetStyle, supplementType, updatedAt: '',
  } as MainLift);
}

// Warm-up + 3 standard main sets (week 3: 5/3/1, top set AMRAP) + optional supplement rows.
async function addDay(cycleId: number, programId: number, liftName: LiftName, week: number, status: WorkoutStatus, supplementCount = 0) {
  const dayId = await db.workoutDays.add({
    cycleId, programId, week, dayIndex: 0, liftName, status,
  } as WorkoutDay);

  const isDeload = week === 4;
  const sets: Omit<WorkoutSet, 'id'>[] = [
    { workoutDayId: dayId as number, setIndex: 0, setType: 'warmup', targetWeight: 40, targetReps: 5, isCompleted: false, isAmrap: false },
    { workoutDayId: dayId as number, setIndex: 1, setType: 'main', targetWeight: 60, targetReps: 5, isCompleted: false, isAmrap: false },
    { workoutDayId: dayId as number, setIndex: 2, setType: 'main', targetWeight: 68, targetReps: isDeload ? 5 : 3, isCompleted: false, isAmrap: false },
    { workoutDayId: dayId as number, setIndex: 3, setType: isDeload ? 'main' : 'amrap', targetWeight: 76, targetReps: isDeload ? 5 : 1, isCompleted: false, isAmrap: !isDeload },
  ];
  for (let i = 0; i < supplementCount; i++) {
    sets.push({ workoutDayId: dayId as number, setIndex: 4 + i, setType: 'supplement', targetWeight: 40, targetReps: 10, isCompleted: false, isAmrap: false });
  }
  await db.workoutSets.bulkAdd(sets as WorkoutSet[]);
  return dayId as number;
}

const supplementSets = (dayId: number) =>
  db.workoutSets.where('workoutDayId').equals(dayId).filter(s => s.setType === 'supplement').toArray();
const mainSets = (dayId: number) =>
  db.workoutSets.where('workoutDayId').equals(dayId).filter(s => s.setType === 'main' || s.setType === 'amrap').sortBy('setIndex');

describe('regenerateActiveCycleForLift', () => {
  beforeEach(clearAll);

  it('adds the lift supplement sets to pending days and leaves completed days untouched', async () => {
    const { programId, cycleId } = await seedProgramCycle();
    await seedLift('bench', '531', 'bbb');
    const week1 = await addDay(cycleId, programId, 'bench', 1, 'completed');
    const week2 = await addDay(cycleId, programId, 'bench', 2, 'pending');

    await regenerateActiveCycleForLift('bench');

    expect(await supplementSets(week2)).toHaveLength(BBB_SETS);
    expect(await supplementSets(week1)).toHaveLength(0);
  });

  it('honors the configured BBB set count', async () => {
    const { programId, cycleId } = await seedProgramCycle();
    await db.settings.update(1, { bbbSets: 3 });
    await seedLift('bench', '531', 'bbb');
    const week2 = await addDay(cycleId, programId, 'bench', 2, 'pending');

    await regenerateActiveCycleForLift('bench');

    expect(await supplementSets(week2)).toHaveLength(3);
  });

  it('removes supplement sets when the lift is set to none', async () => {
    const { programId, cycleId } = await seedProgramCycle();
    await seedLift('bench', '531', 'none');
    const week2 = await addDay(cycleId, programId, 'bench', 2, 'pending', BBB_SETS);

    await regenerateActiveCycleForLift('bench');

    expect(await supplementSets(week2)).toHaveLength(0);
  });

  it('converts the lift to 5s PRO (5 reps, no AMRAP) on pending days', async () => {
    const { programId, cycleId } = await seedProgramCycle();
    await seedLift('bench', '5spro', 'none');
    const day = await addDay(cycleId, programId, 'bench', 3, 'pending');

    await regenerateActiveCycleForLift('bench');

    const sets = await mainSets(day);
    expect(sets.map(s => s.targetReps)).toEqual([5, 5, 5]);
    expect(sets.every(s => !s.isAmrap && s.setType === 'main')).toBe(true);
  });

  it('only affects the targeted lift', async () => {
    const { programId, cycleId } = await seedProgramCycle();
    await seedLift('bench', '5spro', 'none');
    await seedLift('squat', '531', 'bbb');
    const benchDay = await addDay(cycleId, programId, 'bench', 3, 'pending');
    const squatDay = await addDay(cycleId, programId, 'squat', 3, 'pending', BBB_SETS);

    await regenerateActiveCycleForLift('bench');

    // squat day untouched
    expect((await mainSets(squatDay)).map(s => s.targetReps)).toEqual([5, 3, 1]);
    expect(await supplementSets(squatDay)).toHaveLength(BBB_SETS);
    // bench day converted
    expect((await mainSets(benchDay)).map(s => s.targetReps)).toEqual([5, 5, 5]);
  });

  it('does not touch completed days for 5s PRO conversion', async () => {
    const { programId, cycleId } = await seedProgramCycle();
    await seedLift('bench', '5spro', 'none');
    const day = await addDay(cycleId, programId, 'bench', 3, 'completed');

    await regenerateActiveCycleForLift('bench');

    expect((await mainSets(day)).map(s => s.targetReps)).toEqual([5, 3, 1]);
  });

  it('never adds supplement sets to the deload week (week 4)', async () => {
    const { programId, cycleId } = await seedProgramCycle();
    await seedLift('bench', '531', 'bbb');
    const week4 = await addDay(cycleId, programId, 'bench', 4, 'pending');

    await regenerateActiveCycleForLift('bench');

    expect(await supplementSets(week4)).toHaveLength(0);
  });
});
