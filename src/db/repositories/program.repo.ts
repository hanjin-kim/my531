import type { Cycle, MainLift, Program, Settings, WorkoutDay, WorkoutSet } from '../../core/types';
import { createProgram as createProgramFromEngine, advanceCycle as advanceCycleEngine } from '../../core/program-engine';
import { db } from '../schema';

export async function getActiveProgram(): Promise<Program | undefined> {
  return db.programs.where('status').equals('active').first();
}

export async function createNewProgram(mainLifts: MainLift[], settings: Settings): Promise<number> {
  const { program, firstCycle, workoutDays, workoutSets } = createProgramFromEngine(mainLifts, settings);

  return db.transaction('rw', [db.programs, db.cycles, db.workoutDays, db.workoutSets], async () => {
    const programId = (await db.programs.add(program as Program)) as number;

    const cycle: Cycle = { ...firstCycle, programId } as Cycle;
    const cycleId = await db.cycles.add(cycle);

    const days = workoutDays.map(d => ({ ...d, cycleId, programId }));
    const dayIds = await db.workoutDays.bulkAdd(days as WorkoutDay[], { allKeys: true });

    const dayIdMap = new Map<number, number>();
    days.forEach((_, i) => dayIdMap.set(i, dayIds[i]!));

    const sets = workoutSets.map(s => ({
      ...s,
      workoutDayId: dayIdMap.get(s.workoutDayId)!,
    }));
    await db.workoutSets.bulkAdd(sets as WorkoutSet[]);

    return programId;
  });
}

export async function advanceToNextCycle(
  program: Program,
  currentCycle: Cycle,
  mainLifts: MainLift[],
  settings: Settings,
): Promise<{ needsSeventhWeek: boolean; cycleId?: number }> {
  const result = advanceCycleEngine(program, currentCycle, mainLifts, settings);

  async function updateLifts(lifts: MainLift[]) {
    for (const lift of lifts) {
      await db.mainLifts.update(lift.id!, {
        trainingMax: lift.trainingMax,
        updatedAt: lift.updatedAt,
      });
    }
  }

  if (result.needsSeventhWeek) {
    await updateLifts(result.updatedLifts);
    return { needsSeventhWeek: true };
  }

  return db.transaction('rw', [db.cycles, db.workoutDays, db.workoutSets, db.mainLifts, db.programs], async () => {
    await updateLifts(result.updatedLifts);

    const cycleId = await db.cycles.add(result.nextCycle as Cycle);

    const days = result.workoutDays.map(d => ({ ...d, cycleId, programId: program.id! }));
    const dayIds = await db.workoutDays.bulkAdd(days as WorkoutDay[], { allKeys: true });

    const dayIdMap = new Map<number, number>();
    days.forEach((_, i) => dayIdMap.set(i, dayIds[i]!));

    const sets = result.workoutSets.map(s => ({
      ...s,
      workoutDayId: dayIdMap.get(s.workoutDayId)!,
    }));
    await db.workoutSets.bulkAdd(sets as WorkoutSet[]);

    await db.programs.update(program.id!, {
      currentCycleIndex: result.nextCycle.cycleIndex,
    });

    return { needsSeventhWeek: false, cycleId };
  });
}

export async function completeProgram(programId: number): Promise<void> {
  await db.programs.update(programId, {
    status: 'completed',
    completedAt: new Date().toISOString(),
  });
}
